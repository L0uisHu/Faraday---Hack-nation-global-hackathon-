"""Faraday backend — FastAPI app.

POST /api/qc and POST /api/plan call the litsearch pipeline once per
hypothesis (cached in-process), adapt the FinalOutput to our locked schema,
and fall back to mocks on any exception so the demo never breaks.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import adapter
import cache
from mocks import MOCK_PLAN, MOCK_QC
from schemas import HypothesisRequest, LiteratureQC, Plan

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("faraday")

app = FastAPI(
    title="Faraday Backend",
    description="The AI co-scientist, grounded in real research.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3456"],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "faraday-backend"}


def _run_or_cached(hypothesis: str):
    cached = cache.get(hypothesis)
    if cached is not None:
        log.info("pipeline cache hit")
        return cached
    log.info("pipeline cache miss — running litsearch")
    result = adapter.run_pipeline(hypothesis)
    cache.put(hypothesis, result)
    return result


@app.post("/api/qc", response_model=LiteratureQC)
def qc(req: HypothesisRequest) -> LiteratureQC:
    try:
        final, papers = _run_or_cached(req.hypothesis)
        return LiteratureQC(**adapter.adapt_qc(final, papers))
    except Exception as e:
        log.warning("qc fallback to mock: %s", e, exc_info=True)
        return LiteratureQC(**MOCK_QC)


@app.post("/api/plan", response_model=Plan)
def plan(req: HypothesisRequest) -> Plan:
    try:
        final, _ = _run_or_cached(req.hypothesis)
        return Plan(**adapter.adapt_plan(final))
    except Exception as e:
        log.warning("plan fallback to mock: %s", e, exc_info=True)
        return Plan(**MOCK_PLAN)
