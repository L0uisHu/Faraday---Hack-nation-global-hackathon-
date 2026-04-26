// Mirrors backend/schemas.py field-for-field. See schema.md.

export type ReferenceSource = "arxiv" | "pubmed" | "openalex";
export type QCStatus = "novel" | "similar" | "exact_match";

export interface Reference {
  title: string;
  authors: string;
  url: string;
  year: number;
  source: ReferenceSource;
}

export interface LiteratureQC {
  status: QCStatus;
  references: Reference[];
}

export interface ProtocolStep {
  step: number;
  description: string;
  duration: string;
  source_url: string;
}

export interface Material {
  name: string;
  supplier: string;
  catalog_number: string;
  cost_usd: number;
  quantity: string;
  source_url: string;
}

export interface BudgetItem {
  category: string;
  amount_usd: number;
}

export interface Budget {
  total_usd: number;
  breakdown: BudgetItem[];
}

export interface TimelinePhase {
  name: string;
  weeks: [number, number];
  dependencies: string[];
}

export interface Timeline {
  total_weeks: number;
  phases: TimelinePhase[];
}

export interface Validation {
  method: string;
  success_criteria: string;
}

export interface Plan {
  protocol: ProtocolStep[];
  materials: Material[];
  budget: Budget;
  timeline: Timeline;
  validation: Validation;
}
