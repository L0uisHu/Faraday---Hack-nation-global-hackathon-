import type { GanttPhase, GanttTimeline } from "./gantt-types";

export interface DependencyViolation {
  phase_id: string;
  reason: string;
}

/**
 * Pure check: every phase must start at or after the end of all its
 * dependencies. Returns an empty array if valid. Mirrors the server-side
 * check in backend/main.py — we run it client-side first so the snap-back
 * happens instantly without waiting for the network.
 */
export function validateDependencies(
  phases: GanttPhase[],
): DependencyViolation[] {
  const byId = new Map(phases.map((p) => [p.id, p]));
  const violations: DependencyViolation[] = [];
  for (const p of phases) {
    for (const depId of p.depends_on) {
      const dep = byId.get(depId);
      if (!dep) continue;
      const depEnd = dep.start_unit + dep.duration_units; // exclusive
      if (p.start_unit < depEnd) {
        violations.push({
          phase_id: p.id,
          reason: `must start after ${dep.name} ends`,
        });
      }
    }
  }
  return violations;
}

export interface ArrowPathArgs {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** How far past the predecessor's right edge before the vertical leg. */
  elbowOffset?: number;
  /** Pixel nudge for the vertical segment so stacked arrows don't overlap. */
  laneOffset?: number;
}

/**
 * Orthogonal Gantt-style arrow: right out of the predecessor, vertical, then
 * right into the dependent. Returns an SVG path-data string.
 */
export function buildArrowPath({
  fromX,
  fromY,
  toX,
  toY,
  elbowOffset = 8,
  laneOffset = 0,
}: ArrowPathArgs): string {
  const elbowX = fromX + elbowOffset + laneOffset;
  return [`M ${fromX} ${fromY}`, `H ${elbowX}`, `V ${toY}`, `H ${toX}`].join(
    " ",
  );
}

// --- LaTeX export ------------------------------------------------------------

// Characters that need escaping inside ganttbar text. Limited set — phase
// names are short and typically alphanumeric. We don't try to be exhaustive.
function escapeLatex(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/_/g, "\\_")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

/**
 * Build a self-contained pgfgantt snippet that compiles as-is in any LaTeX
 * doc with \usepackage{pgfgantt}. Plain numeric axis — no unit prefix, no
 * coloured title band — to match the on-screen aesthetic.
 */
export function buildLatexSnippet(t: GanttTimeline): string {
  const total = Math.max(
    1,
    t.total_duration,
    ...t.phases.map((p) => p.start_unit + p.duration_units - 1),
  );
  const safeUnit =
    typeof t.unit === "string" && t.unit.length > 0 ? t.unit : "weeks";
  const unitSingular =
    safeUnit.charAt(0).toUpperCase() + safeUnit.slice(1, -1);
  const titleList = Array.from({ length: total }, (_, i) => i + 1).join(",");

  const bars = t.phases
    .map((p, i) => {
      const start = p.start_unit;
      const end = p.start_unit + p.duration_units - 1;
      const safeName = escapeLatex(p.name);
      const trailer = i === t.phases.length - 1 ? "" : " \\\\";
      return `  \\ganttbar[name=${p.id}]{${safeName}}{${start}}{${end}}${trailer}`;
    })
    .join("\n");

  const links = t.phases
    .flatMap((p) =>
      p.depends_on.map((depId) => `  \\ganttlink{${depId}}{${p.id}}`),
    )
    .join("\n");

  return `\\documentclass{article}
\\usepackage{pgfgantt}
\\usepackage[margin=1in]{geometry}

\\begin{document}

\\begin{ganttchart}[
  hgrid, vgrid,
  x unit=0.7cm,
  y unit chart=0.6cm,
  bar/.append style={fill=black!85, draw=black},
  bar height=0.6,
  title/.style={fill=white, draw=black!20},
  title label font=\\sffamily\\small\\color{black!50},
]{1}{${total}}
  \\gantttitlelist[title list options={var=\\x, evaluate=\\x as \\result using "${unitSingular} \\x"}]{${titleList}}{1} \\\\
${bars}
${links ? "\n" + links : ""}
\\end{ganttchart}

\\end{document}
`;
}

// --- Image export ------------------------------------------------------------

/** Serialize an in-DOM SVG element to a standalone string. */
export function serializeSvg(svg: SVGSVGElement): string {
  // Clone so we don't mutate the live DOM, then ensure xmlns is present —
  // browsers add it implicitly when rendering, but a downloaded standalone
  // file needs it explicitly.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  return new XMLSerializer().serializeToString(clone);
}

/**
 * Rasterize an SVG element to a PNG Blob via an offscreen canvas. No deps.
 * The trick: turn the SVG into a data URL, load it into an Image, then drawImage
 * onto a canvas at the SVG's intrinsic size (scaled up for crispness).
 */
export async function svgToPngBlob(
  svg: SVGSVGElement,
  scale = 2,
): Promise<Blob> {
  const xml = serializeSvg(svg);
  // SVG → base64 data URL (UTF-8 safe via TextEncoder + btoa).
  const bytes = new TextEncoder().encode(xml);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const dataUrl = `data:image/svg+xml;base64,${btoa(binary)}`;

  const viewBox = svg.viewBox.baseVal;
  const width = (viewBox.width || svg.clientWidth) * scale;
  const height = (viewBox.height || svg.clientHeight) * scale;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg load failed"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

/** Trigger a browser download for a Blob with the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
