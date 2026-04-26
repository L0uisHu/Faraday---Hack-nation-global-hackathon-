import { MOCK_PLAN, MOCK_QC } from "./mock-data";
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
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
