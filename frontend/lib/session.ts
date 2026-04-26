// Cross-page state via sessionStorage. Survives client-side navigations,
// scoped per browser tab, dies on tab close. No state library needed.

import type { LiteratureQC, Plan } from "./types";

const KEYS = {
  hypothesis: "faraday:hypothesis",
  qc: "faraday:qc",
  plan: "faraday:plan",
} as const;

function set(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const saveHypothesis = (v: string) => set(KEYS.hypothesis, v);
export const loadHypothesis = () => get<string>(KEYS.hypothesis);

export const saveQC = (v: LiteratureQC) => set(KEYS.qc, v);
export const loadQC = () => get<LiteratureQC>(KEYS.qc);

export const savePlan = (v: Plan) => set(KEYS.plan, v);
export const loadPlan = () => get<Plan>(KEYS.plan);
