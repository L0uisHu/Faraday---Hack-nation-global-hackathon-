// Phases the QC pipeline actually runs (see backend/agent/litsearch/pipeline.py).
// Order matters: the index drives the progress bar fill.
export const QC_PHASES = [
  { id: "parse", label: "Parsing hypothesis" },
  {
    id: "search",
    label: "Searching arXiv · PubMed · bioRxiv · medRxiv (38M+ papers)",
  },
  { id: "rank", label: "Ranking candidates by relevance" },
  { id: "verify", label: "Verifying citations" },
] as const;

export type QCPhase = (typeof QC_PHASES)[number];
export type QCPhaseId = QCPhase["id"];
