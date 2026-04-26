# litsearch/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional


class SearchIntent(BaseModel):
    domain: str
    task_type: str
    main_process: Optional[str] = None
    observable: Optional[str] = None
    method: Optional[str] = None
    theory_accuracy: Optional[str] = None
    required_terms: List[str] = Field(default_factory=list)
    synonyms: List[str] = Field(default_factory=list)
    arxiv_categories: List[str] = Field(default_factory=list)
    search_queries: List[str] = Field(default_factory=list)


class Paper(BaseModel):
    title: str
    authors: List[str]
    abstract: str
    published: str
    url: str
    pdf_url: Optional[str] = None
    categories: List[str] = Field(default_factory=list)


class PaperScore(BaseModel):
    title: str
    url: str
    relevance_score: int
    reason: str
    matched_terms: List[str] = Field(default_factory=list)
    missing_terms: List[str] = Field(default_factory=list)


class RankingResult(BaseModel):
    ranked_papers: List[PaperScore]


class NoveltyAssessment(BaseModel):
    novelty_signal: str
    explanation: str
    most_relevant_references: List[str] = Field(default_factory=list)


class ExperimentDescription(BaseModel):
    title: str
    scientific_goal: str
    experiment_type: str
    hypothesis: str
    system_or_process: str
    intervention_or_method: Optional[str] = None
    control_or_baseline: Optional[str] = None
    measured_observables: List[str] = Field(default_factory=list)
    required_data_or_inputs: List[str] = Field(default_factory=list)
    expected_output: str
    validation_strategy: str
    relation_to_existing_literature: str
    limitations: List[str] = Field(default_factory=list)


# -------------------------------
# Internal pipeline result
# -------------------------------

class LiteratureQCResult(BaseModel):
    search_intent: SearchIntent
    retrieved_papers: List[Paper]
    ranking: RankingResult
    summary: str
    experiment_description: ExperimentDescription
    novelty: NoveltyAssessment


# -------------------------------
# Public final output
# -------------------------------

class LiteratureReference(BaseModel):
    title: str
    url: str
    relevance_score: int
    reason: str


class LiteratureQCOutput(BaseModel):
    status: str = Field(
        description="One of: exact match found, similar work exists, not found"
    )
    references: List[LiteratureReference] = Field(default_factory=list)


class ProtocolStep(BaseModel):
    step_number: int
    title: str
    description: str
    estimated_duration: Optional[str] = None
    notes: Optional[str] = None


class MaterialItem(BaseModel):
    name: str
    purpose: str
    quantity: Optional[str] = None
    supplier_or_source: Optional[str] = None
    estimated_cost: Optional[str] = None


class BudgetItem(BaseModel):
    item: str
    estimated_cost: str
    notes: Optional[str] = None


class TimelinePhase(BaseModel):
    phase: str
    duration: str
    dependencies: List[str] = Field(default_factory=list)
    deliverables: List[str] = Field(default_factory=list)


class ValidationItem(BaseModel):
    criterion: str
    method: str
    success_threshold: Optional[str] = None


class ExperimentPlanOutput(BaseModel):
    protocol: List[ProtocolStep]
    materials: List[MaterialItem]
    budget: List[BudgetItem]
    timeline: List[TimelinePhase]
    validation: List[ValidationItem]


class FinalOutput(BaseModel):
    literature_qc: LiteratureQCOutput
    plan: ExperimentPlanOutput