import { fromGantt } from "./gantt-adapter";
import type { GanttTimeline } from "./gantt-types";
import { MOCK_PLAN, MOCK_QC } from "./mock-data";
import { loadPlan, savePlan } from "./session";
import type { LiteratureQC, Plan } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function postJSON<T>(path: string, body: unknown, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const payload = (await res.json()) as { detail?: string };
        if (payload?.detail) detail = payload.detail;
      } catch {
        // ignore JSON parse errors and keep status text
      }
      throw new Error(detail);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof Error && !err.message.startsWith("Failed to fetch")) {
      throw err;
    }
    console.warn(`[faraday] ${path} failed, falling back to mock:`, err);
    return fallback;
  }
}

export function fetchQC(hypothesis: string): Promise<LiteratureQC> {
  return postJSON<LiteratureQC>("/api/qc", { hypothesis }, MOCK_QC);
}

export function fetchPlan(hypothesis: string): Promise<Plan> {
  return postJSON<Plan>("/api/plan", { hypothesis }, MOCK_PLAN);
}

// Shape the gantt component references for unreachable server errors.
// Local validateDependencies snap-backs invalid drags before save, so
// nothing in this module ever throws this — kept as a typed escape hatch.
export interface TimelineValidationError extends Error {
  violations: { phase_id: string; reason: string }[];
}

// sessionStorage-only persistence: read the full plan, swap timeline, write back.
// Returns the input gantt-shape unchanged so the component's pristine snapshot
// matches what it sent.
export async function patchTimeline(g: GanttTimeline): Promise<GanttTimeline> {
  const plan = loadPlan();
  if (plan) savePlan({ ...plan, timeline: fromGantt(g) });
  return g;
}
