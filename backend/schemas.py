"""Pydantic v2 models — the locked contract for /api/qc and /api/plan.

Mirrored field-for-field by frontend/lib/types.ts. Do not rename a
field here without updating both the TS types and schema.md in the
same change.
"""
from typing import List, Literal, Tuple

from pydantic import BaseModel, Field


# --- Request payloads ---------------------------------------------------------

class HypothesisRequest(BaseModel):
    hypothesis: str = Field(..., min_length=1)


# --- Literature QC ------------------------------------------------------------

ReferenceSource = Literal["arxiv", "pubmed", "openalex"]
QCStatus = Literal["novel", "similar", "exact_match"]


class Reference(BaseModel):
    title: str
    authors: str
    url: str
    year: int
    source: ReferenceSource


class LiteratureQC(BaseModel):
    status: QCStatus
    references: List[Reference]


# --- Plan ---------------------------------------------------------------------

class ProtocolStep(BaseModel):
    step: int
    description: str
    duration: str
    source_url: str


class Material(BaseModel):
    name: str
    supplier: str
    catalog_number: str
    cost_usd: float
    quantity: str
    source_url: str


class BudgetItem(BaseModel):
    category: str
    amount_usd: float


class Budget(BaseModel):
    total_usd: float
    breakdown: List[BudgetItem]


class TimelinePhase(BaseModel):
    name: str
    weeks: Tuple[int, int]
    dependencies: List[str]


class Timeline(BaseModel):
    total_weeks: int
    phases: List[TimelinePhase]


class Validation(BaseModel):
    method: str
    success_criteria: str


class Plan(BaseModel):
    protocol: List[ProtocolStep]
    materials: List[Material]
    budget: Budget
    timeline: Timeline
    validation: Validation
