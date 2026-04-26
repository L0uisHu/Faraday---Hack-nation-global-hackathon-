// View-model for the Gantt component. Richer than the canonical `Timeline`
// (which mirrors the backend) — uses unit-based geometry and stable IDs so
// the chart can address phases independently of their human-readable name.
// Adapters in ./gantt-adapter translate between this and the canonical type.

export interface GanttPhase {
  id: string;
  name: string;
  start_unit: number;
  duration_units: number;
  depends_on: string[];
}

export interface GanttTimeline {
  unit: string;
  total_duration: number;
  phases: GanttPhase[];
}
