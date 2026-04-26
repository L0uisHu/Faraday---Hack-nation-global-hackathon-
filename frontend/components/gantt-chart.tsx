"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  buildArrowPath,
  buildLatexSnippet,
  downloadBlob,
  serializeSvg,
  svgToPngBlob,
  validateDependencies,
} from "@/lib/gantt";
import { patchTimeline, type TimelineValidationError } from "@/lib/api";
import type { GanttPhase, GanttTimeline } from "@/lib/gantt-types";

// SVG logical coordinate space — the viewBox scales to whatever pixel width
// the card lays out at, so all internal math stays unit-clean.
const VIEWBOX_WIDTH = 1000;
const LEFT_PANEL = 200;
const RIGHT_PADDING = 16;
const HEADER_HEIGHT = 24;
const ROW_HEIGHT = 36;
const BAR_HEIGHT = 22;
const RESIZE_HANDLE_W = 8; // viewBox units; ~6–10px on screen
const SAVE_DEBOUNCE_MS = 800;
const FLASH_MS = 600;
const NAME_TRUNCATE_AT = 26;

type SaveStatus = "saved" | "unsaved" | "saving";
type DragMode = "move" | "resize";

interface DragState {
  phaseId: string;
  mode: DragMode;
  origStart: number;
  origDuration: number;
  /** Pointer X at drag-start, expressed in unit-space (not screen pixels). */
  startUnitX: number;
  /** Phases as they were before this drag began — used for snap-back. */
  snapshot: GanttPhase[];
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

function statusLabel(s: SaveStatus): string {
  return s === "saved" ? "saved" : s === "saving" ? "saving…" : "unsaved changes";
}

export function GanttChart({ timeline: initial }: { timeline: GanttTimeline }) {
  // We treat `initial` as the load-time pristine state. `pristine` updates on
  // every successful save so Reset always returns to "last known good".
  const [timeline, setTimeline] = useState<GanttTimeline>(initial);
  const [pristine, setPristine] = useState<GanttTimeline>(initial);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [exportOpen, setExportOpen] = useState(false);
  const [latexOpen, setLatexOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // If the parent re-feeds a new timeline (e.g. from a re-fetch), reset state.
  useEffect(() => {
    setTimeline(initial);
    setPristine(initial);
    setSaveStatus("saved");
  }, [initial]);

  // Close the export popover on outside click.
  useEffect(() => {
    if (!exportOpen) return;
    function onDown(e: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [exportOpen]);

  // Debounced save: any time the timeline differs from pristine, queue a
  // PATCH after 800ms of quiet. Server-side validation is a backstop —
  // local validateDependencies has already snap-backed bad drags.
  useEffect(() => {
    if (saveStatus !== "unsaved") return;
    const id = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const saved = await patchTimeline(timeline);
        setTimeline(saved);
        setPristine(saved);
        setSaveStatus("saved");
      } catch (err) {
        const violations = (err as TimelineValidationError)?.violations;
        if (violations?.length) {
          setTimeline(pristine);
          flash(violations.map((v) => v.phase_id));
        }
        setSaveStatus("saved");
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [timeline, saveStatus, pristine]);

  function flash(ids: string[]) {
    setFlashIds(new Set(ids));
    window.setTimeout(() => setFlashIds(new Set()), FLASH_MS);
  }

  // --- Geometry ------------------------------------------------------------

  // Display total expands if a phase has been dragged past the original end,
  // so bars never fall off the right edge during a drag.
  const phaseEndMax = timeline.phases.reduce(
    (m, p) => Math.max(m, p.start_unit + p.duration_units - 1),
    0,
  );
  const total = Math.max(1, timeline.total_duration, phaseEndMax);

  const chartLeft = LEFT_PANEL;
  const chartWidth = VIEWBOX_WIDTH - LEFT_PANEL - RIGHT_PADDING;
  const pixelsPerUnit = chartWidth / total;
  const chartHeight = Math.max(ROW_HEIGHT, timeline.phases.length * ROW_HEIGHT);
  const svgHeight = HEADER_HEIGHT + chartHeight;

  const unitToX = useCallback(
    (u: number) => chartLeft + u * pixelsPerUnit,
    [chartLeft, pixelsPerUnit],
  );

  // Cap rendered axis ticks. With full-word labels ("Week 12", "Semester 1")
  // each tick needs ~80 viewBox units of breathing room, so stride for ~12 max.
  const tickStride = Math.max(1, Math.ceil(total / 12));
  // Defensive fallback: stale/malformed cached payloads can miss `unit`.
  const safeUnit =
    typeof timeline.unit === "string" && timeline.unit.length > 0
      ? timeline.unit
      : "weeks";
  const unitSingular =
    safeUnit.charAt(0).toUpperCase() + safeUnit.slice(1, -1);

  const phaseRowMidY = useCallback(
    (idx: number) => HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2,
    [],
  );

  // Pre-compute index lookups so arrow geometry doesn't scan the array.
  const phaseIndex = useMemo(() => {
    const m = new Map<string, number>();
    timeline.phases.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [timeline.phases]);

  const arrows = useMemo(() => {
    const out: { d: string; key: string }[] = [];
    let lane = 0;
    timeline.phases.forEach((p, toIdx) => {
      const toY = phaseRowMidY(toIdx);
      const toX = unitToX(p.start_unit - 1) - 1;
      p.depends_on.forEach((depId) => {
        const fromIdx = phaseIndex.get(depId);
        if (fromIdx === undefined) return;
        const from = timeline.phases[fromIdx];
        const fromY = phaseRowMidY(fromIdx);
        const fromX = unitToX(from.start_unit - 1 + from.duration_units);
        out.push({
          d: buildArrowPath({
            fromX,
            fromY,
            toX,
            toY,
            laneOffset: (lane % 4) * 4,
          }),
          key: `${depId}->${p.id}`,
        });
        lane += 1;
      });
    });
    return out;
  }, [timeline.phases, phaseIndex, unitToX, phaseRowMidY]);

  // --- Drag handlers -------------------------------------------------------

  // Convert a clientX to a position in unit-space using the SVG's bounding
  // rect so it works regardless of the page's render scale.
  function clientXToUnit(clientX: number): number {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const viewboxX = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
    return (viewboxX - chartLeft) / pixelsPerUnit;
  }

  function startDrag(
    e: ReactPointerEvent<SVGRectElement>,
    phase: GanttPhase,
    mode: DragMode,
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      phaseId: phase.id,
      mode,
      origStart: phase.start_unit,
      origDuration: phase.duration_units,
      startUnitX: clientXToUnit(e.clientX),
      snapshot: timeline.phases,
    });
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!drag) return;
    const deltaUnits = Math.round(clientXToUnit(e.clientX) - drag.startUnitX);
    if (deltaUnits === 0) return;
    setTimeline((t) => ({
      ...t,
      phases: t.phases.map((p) => {
        if (p.id !== drag.phaseId) return p;
        if (drag.mode === "move") {
          return {
            ...p,
            start_unit: Math.max(1, drag.origStart + deltaUnits),
          };
        }
        return {
          ...p,
          duration_units: Math.max(1, drag.origDuration + deltaUnits),
        };
      }),
    }));
  }

  function onPointerUp() {
    if (!drag) return;
    // Local validation: cheaper than waiting for the server. If invalid,
    // revert to the snapshot taken at drag-start and flash the offender red.
    const violations = validateDependencies(timeline.phases);
    const offending = violations.find((v) => v.phase_id === drag.phaseId);
    if (offending) {
      setTimeline((t) => ({ ...t, phases: drag.snapshot }));
      flash([drag.phaseId]);
    } else if (
      timeline.phases.find((p) => p.id === drag.phaseId)?.start_unit !==
        drag.origStart ||
      timeline.phases.find((p) => p.id === drag.phaseId)?.duration_units !==
        drag.origDuration
    ) {
      setSaveStatus("unsaved");
    }
    setDrag(null);
  }

  // --- Toolbar handlers ----------------------------------------------------

  function handleAddPhase() {
    const newPhase: GanttPhase = {
      id: `phase-${Date.now()}`,
      name: "New phase",
      start_unit: 1,
      duration_units: 1,
      depends_on: [],
    };
    setTimeline((t) => ({ ...t, phases: [...t.phases, newPhase] }));
    setSaveStatus("unsaved");
  }

  function handleDeletePhase(id: string) {
    setTimeline((t) => ({
      ...t,
      phases: t.phases
        .filter((p) => p.id !== id)
        .map((p) => ({
          ...p,
          depends_on: p.depends_on.filter((d) => d !== id),
        })),
    }));
    setSaveStatus("unsaved");
  }

  function handleReset() {
    setTimeline(pristine);
    setSaveStatus("saved");
  }

  async function handleExportSvg() {
    if (!svgRef.current) return;
    const xml = serializeSvg(svgRef.current);
    downloadBlob(new Blob([xml], { type: "image/svg+xml" }), "gantt.svg");
    setExportOpen(false);
  }

  async function handleExportPng() {
    if (!svgRef.current) return;
    try {
      const blob = await svgToPngBlob(svgRef.current, 2);
      downloadBlob(blob, "gantt.png");
    } catch (err) {
      console.error("[gantt] PNG export failed:", err);
    }
    setExportOpen(false);
  }

  function handleExportLatex() {
    setLatexOpen(true);
    setExportOpen(false);
  }

  async function handleSaveNow() {
    setSaveStatus("saving");
    try {
      const saved = await patchTimeline(timeline);
      setTimeline(saved);
      setPristine(saved);
      setSaveStatus("saved");
    } catch (err) {
      const violations = (err as TimelineValidationError)?.violations;
      if (violations?.length) {
        setTimeline(pristine);
        flash(violations.map((v) => v.phase_id));
      }
      setSaveStatus("saved");
    }
  }

  const dirty = saveStatus !== "saved";

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-muted-foreground">
            {`// ${timeline.phases.length} phases`}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAddPhase}>
              + Add phase
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!dirty}
            >
              Reset
            </Button>

            <div ref={exportMenuRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportOpen((v) => !v)}
              >
                Export
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-md border border-border bg-popover text-sm text-popover-foreground shadow-md">
                  <button
                    type="button"
                    onClick={handleExportPng}
                    className="block w-full px-3 py-1.5 text-left hover:bg-accent"
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSvg}
                    className="block w-full px-3 py-1.5 text-left hover:bg-accent"
                  >
                    SVG
                  </button>
                  <button
                    type="button"
                    onClick={handleExportLatex}
                    className="block w-full px-3 py-1.5 text-left hover:bg-accent"
                  >
                    LaTeX
                  </button>
                </div>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleSaveNow}
              disabled={!dirty || saveStatus === "saving"}
            >
              Save
            </Button>

            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {statusLabel(saveStatus)}
            </span>
          </div>
        </div>

        {/* Chart */}
        {timeline.phases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No phases.</p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${svgHeight}`}
              className="w-full min-w-[640px] select-none"
              role="img"
              aria-label="Gantt chart"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <defs>
                <marker
                  id="gantt-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
                </marker>
              </defs>

              {/* Quiet axis — "Week 1", "Semester 2", etc. in muted grey */}
              {Array.from({ length: total }, (_, i) => i + 1)
                .filter((u) => u % tickStride === 0 || u === 1)
                .map((u) => {
                  const xMid = unitToX(u - 1) + pixelsPerUnit / 2;
                  return (
                    <text
                      key={`hdr-${u}`}
                      x={xMid}
                      y={HEADER_HEIGHT - 8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#9ca3af"
                      fontSize={10}
                      fontWeight={400}
                    >
                      {`${unitSingular} ${u}`}
                    </text>
                  );
                })}

              {/* Alternating row backgrounds + bars */}
              {timeline.phases.map((p, idx) => {
                const rowTop = HEADER_HEIGHT + idx * ROW_HEIGHT;
                const rowMid = phaseRowMidY(idx);
                const barX = unitToX(p.start_unit - 1);
                const barWidth = Math.max(2, p.duration_units * pixelsPerUnit);
                const isFlashing = flashIds.has(p.id);
                return (
                  <g key={p.id}>
                    {idx % 2 === 1 && (
                      <rect
                        x={0}
                        y={rowTop}
                        width={VIEWBOX_WIDTH}
                        height={ROW_HEIGHT}
                        fill="#f3f4f6"
                      />
                    )}
                    {/* Phase name in left panel */}
                    <text
                      x={LEFT_PANEL - 12}
                      y={rowMid}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={500}
                      fill="#111827"
                    >
                      {truncate(p.name, NAME_TRUNCATE_AT)}
                      <title>{p.name}</title>
                    </text>
                    {/* Delete button — pure SVG so PNG export still works */}
                    <g
                      onClick={() => handleDeletePhase(p.id)}
                      style={{ cursor: "pointer" }}
                      role="button"
                      aria-label={`Delete phase ${p.name}`}
                    >
                      <circle
                        cx={14}
                        cy={rowMid}
                        r={7}
                        fill="white"
                        stroke="#d1d5db"
                        strokeWidth={1}
                      />
                      <text
                        x={14}
                        y={rowMid}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight={500}
                        fill="#6b7280"
                        pointerEvents="none"
                      >
                        ×
                      </text>
                    </g>
                    {/* Bar body — sharp corners, draggable */}
                    <rect
                      x={barX}
                      y={rowMid - BAR_HEIGHT / 2}
                      width={barWidth}
                      height={BAR_HEIGHT}
                      fill={isFlashing ? "#dc2626" : "#1f2937"}
                      style={{
                        cursor: drag?.phaseId === p.id ? "grabbing" : "grab",
                        transition: isFlashing ? undefined : "fill 120ms",
                      }}
                      onPointerDown={(e) => startDrag(e, p, "move")}
                    />
                    {/* Resize handle — invisible rect at right edge */}
                    <rect
                      x={barX + barWidth - RESIZE_HANDLE_W}
                      y={rowMid - BAR_HEIGHT / 2}
                      width={RESIZE_HANDLE_W}
                      height={BAR_HEIGHT}
                      fill="transparent"
                      style={{ cursor: "ew-resize" }}
                      onPointerDown={(e) => startDrag(e, p, "resize")}
                    />
                  </g>
                );
              })}

              {/* Vertical grid — drawn after rows so lines sit on top of zebra */}
              {Array.from({ length: total + 1 }, (_, i) => i).map((u) => {
                const x = unitToX(u);
                return (
                  <line
                    key={`grid-${u}`}
                    x1={x}
                    x2={x}
                    y1={HEADER_HEIGHT}
                    y2={HEADER_HEIGHT + chartHeight}
                    stroke="#e5e7eb"
                    strokeWidth={u === 0 || u === total ? 1 : 0.5}
                  />
                );
              })}
              {/* Top border under the header */}
              <line
                x1={0}
                x2={VIEWBOX_WIDTH}
                y1={HEADER_HEIGHT}
                y2={HEADER_HEIGHT}
                stroke="#cbd5e1"
                strokeWidth={1}
              />

              {/* Dependency arrows — last layer so they sit above bars */}
              {arrows.map((a) => (
                <path
                  key={a.key}
                  d={a.d}
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth={1.25}
                  markerEnd="url(#gantt-arrow)"
                />
              ))}
            </svg>
          </div>
        )}
      </CardContent>

      {latexOpen && (
        <LatexModal
          snippet={buildLatexSnippet(timeline)}
          onClose={() => setLatexOpen(false)}
        />
      )}
    </Card>
  );
}

// --- LaTeX modal -------------------------------------------------------------

function LatexModal({
  snippet,
  onClose,
}: {
  snippet: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Esc closes — small affordance, costs nothing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; user can still select-all manually */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold">LaTeX (pgfgantt)</h3>
            <p className="text-xs text-muted-foreground">
              Paste into a doc with{" "}
              <code className="font-mono">\usepackage&#123;pgfgantt&#125;</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <pre className="overflow-auto whitespace-pre p-4 font-mono text-xs leading-relaxed">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
