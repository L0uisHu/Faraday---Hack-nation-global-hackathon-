"""Adapts teammate's litsearch.FinalOutput to our locked LiteratureQC and Plan.

The teammate's pipeline returns a FinalOutput whose field names and shape
diverge from our schema (see schema.md). This module isolates the mapping:
status enum normalization, type coercions, parse-from-string for cost and
duration, and structural restructuring (his flat lists -> our
{ total + breakdown } and { total_weeks + phases } objects).

Also exposes run_pipeline(), a thin wrapper over the litsearch pipeline that
additionally returns retrieved_papers — needed because his
FinalOutput.literature_qc.references drops authors and year, which we
recover via URL lookup against the original papers list.
"""
import logging
import re
from datetime import date
from typing import Literal

from agent.litsearch.output_builder import build_final_output
from agent.litsearch.pipeline import run_internal_literature_qc
from agent.litsearch.plan_generation import generate_experiment_plan
from agent.litsearch.schemas import (
    BudgetItem,
    ExperimentPlanOutput,
    FinalOutput,
    MaterialItem,
    Paper,
    ProtocolStep,
    TimelinePhase,
    ValidationItem,
)

log = logging.getLogger(__name__)


# --- Pipeline wrapper --------------------------------------------------------

def run_pipeline(hypothesis: str) -> tuple[FinalOutput, list[Paper]]:
    """Mirrors litsearch.pipeline.run_literature_qc but exposes retrieved_papers.

    His public run_literature_qc swallows retrieved_papers — we need them to
    fill in authors and year on our reference shape. So we re-do the assembly
    here using his internal building blocks.
    """
    internal = run_internal_literature_qc(hypothesis)
    top_urls = {p.url for p in internal.ranking.ranked_papers}
    top_papers = [p for p in internal.retrieved_papers if p.url in top_urls]
    plan = generate_experiment_plan(
        user_prompt=hypothesis,
        search_intent=internal.search_intent,
        top_papers=top_papers,
        ranking=internal.ranking,
        experiment_description=internal.experiment_description,
    )
    final = build_final_output(internal_result=internal, plan=plan)
    return final, internal.retrieved_papers


# --- Status enum mapping -----------------------------------------------------

QCStatus = Literal["novel", "similar", "exact_match"]

_STATUS_MAP: dict[str, QCStatus] = {
    "exact match found": "exact_match",
    "similar work exists": "similar",
    "not found": "novel",
}


def _map_status(novelty_signal: str) -> QCStatus:
    return _STATUS_MAP.get((novelty_signal or "").strip().lower(), "similar")


# --- String parsers ---------------------------------------------------------

_NUMBER_RE = re.compile(r"(\d[\d,]*\.?\d*)")


def _parse_cost(s: str | None) -> float:
    """Pulls the first number out of strings like '$120-150', '~$2,400 USD'.

    His estimated_cost is free-form. Returns 0.0 if no number found.
    """
    if not s:
        return 0.0
    m = _NUMBER_RE.search(s)
    if not m:
        return 0.0
    try:
        return float(m.group(1).replace(",", ""))
    except ValueError:
        return 0.0


def _parse_duration_weeks(s: str | None) -> int:
    """Coerce strings like '2 weeks', '3 days', '1 month' into integer weeks.

    Defaults to 1 week if unparseable, so timelines never collapse to zero.
    """
    if not s:
        return 1
    m = _NUMBER_RE.search(s)
    if not m:
        return 1
    try:
        n = float(m.group(1).replace(",", ""))
    except ValueError:
        return 1
    lower = s.lower()
    if "month" in lower:
        weeks = n * 4
    elif "year" in lower:
        weeks = n * 52
    elif "day" in lower:
        weeks = n / 7
    elif "hour" in lower:
        weeks = n / (24 * 7)
    else:
        weeks = n
    return max(1, int(round(weeks)))


# --- References -------------------------------------------------------------

def _build_references(final: FinalOutput, papers: list[Paper]) -> list[dict]:
    by_url = {p.url: p for p in papers}
    out: list[dict] = []
    for ref in final.literature_qc.references:
        paper = by_url.get(ref.url)
        if paper and paper.authors:
            authors = ", ".join(paper.authors)
        else:
            authors = "Unknown"
        year = date.today().year
        if paper and paper.published and len(paper.published) >= 4:
            try:
                year = int(paper.published[:4])
            except ValueError:
                pass
        out.append({
            "title": ref.title,
            "authors": authors,
            "url": ref.url,
            "year": year,
            "source": "arxiv",
        })
    return out


# --- Plan sections ----------------------------------------------------------

def _adapt_protocol(steps: list[ProtocolStep]) -> list[dict]:
    out: list[dict] = []
    for s in steps:
        title = (s.title or "").strip(". ").strip()
        body = (s.description or "").strip()
        desc = f"{title}. {body}".strip(". ").strip() if title else body
        if s.notes:
            desc = f"{desc} Notes: {s.notes}".strip()
        out.append({
            "step": s.step_number,
            "description": desc,
            "duration": s.estimated_duration or "TBD",
            "source_url": "",
        })
    return out


def _adapt_materials(items: list[MaterialItem]) -> list[dict]:
    return [
        {
            "name": m.name,
            "supplier": m.supplier_or_source or "TBD",
            "catalog_number": "N/A",
            "cost_usd": _parse_cost(m.estimated_cost),
            "quantity": m.quantity or "TBD",
            "source_url": "",
        }
        for m in items
    ]


def _adapt_budget(items: list[BudgetItem]) -> dict:
    breakdown: list[dict] = []
    total = 0.0
    for b in items:
        amt = _parse_cost(b.estimated_cost)
        total += amt
        breakdown.append({"category": b.item, "amount_usd": amt})
    return {"total_usd": round(total, 2), "breakdown": breakdown}


def _adapt_timeline(phases: list[TimelinePhase]) -> dict:
    out_phases: list[dict] = []
    cursor = 1
    for p in phases:
        weeks = _parse_duration_weeks(p.duration)
        start = cursor
        end = start + weeks - 1
        cursor = end + 1
        out_phases.append({
            "name": p.phase,
            "weeks": (start, end),
            "dependencies": list(p.dependencies),
        })
    total_weeks = (cursor - 1) if out_phases else 0
    return {"total_weeks": total_weeks, "phases": out_phases}


def _adapt_validation(items: list[ValidationItem]) -> dict:
    if not items:
        return {"method": "TBD", "success_criteria": "TBD"}
    methods = [v.method for v in items if v.method]
    crits: list[str] = []
    for v in items:
        if v.success_threshold:
            crits.append(f"{v.criterion}: {v.success_threshold}")
        else:
            crits.append(v.criterion)
    return {
        "method": "; ".join(methods) if methods else "TBD",
        "success_criteria": "; ".join(crits) if crits else "TBD",
    }


# --- Public adapt entrypoints -----------------------------------------------

def adapt_qc(final: FinalOutput, papers: list[Paper]) -> dict:
    return {
        "status": _map_status(final.literature_qc.status),
        "references": _build_references(final, papers),
    }


def adapt_plan(final: FinalOutput) -> dict:
    plan: ExperimentPlanOutput = final.plan
    return {
        "protocol": _adapt_protocol(plan.protocol),
        "materials": _adapt_materials(plan.materials),
        "budget": _adapt_budget(plan.budget),
        "timeline": _adapt_timeline(plan.timeline),
        "validation": _adapt_validation(plan.validation),
    }
