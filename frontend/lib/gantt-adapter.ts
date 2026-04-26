import type { Timeline } from "./types";
import type { GanttPhase, GanttTimeline } from "./gantt-types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "phase";
}

export function toGantt(t: Timeline): GanttTimeline {
  const ids = t.phases.map((p, i) => `${slugify(p.name)}-${i}`);
  const nameToId = new Map<string, string>();
  t.phases.forEach((p, i) => nameToId.set(p.name, ids[i]));

  const phases: GanttPhase[] = t.phases.map((p, i) => ({
    id: ids[i],
    name: p.name,
    start_unit: p.weeks[0],
    duration_units: Math.max(1, p.weeks[1] - p.weeks[0] + 1),
    depends_on: p.dependencies
      .map((dep) => nameToId.get(dep))
      .filter((x): x is string => Boolean(x)),
  }));

  return {
    unit: "weeks",
    total_duration: t.total_weeks,
    phases,
  };
}

export function fromGantt(g: GanttTimeline): Timeline {
  const idToName = new Map<string, string>();
  g.phases.forEach((p) => idToName.set(p.id, p.name));

  const phases = g.phases.map((p) => ({
    name: p.name,
    weeks: [p.start_unit, p.start_unit + p.duration_units - 1] as [number, number],
    dependencies: p.depends_on
      .map((id) => idToName.get(id))
      .filter((x): x is string => Boolean(x)),
  }));

  const phaseEndMax = g.phases.reduce(
    (m, p) => Math.max(m, p.start_unit + p.duration_units - 1),
    0,
  );

  return {
    total_weeks: Math.max(g.total_duration, phaseEndMax),
    phases,
  };
}
