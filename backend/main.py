"""Faraday backend — FastAPI app.

POST /api/qc and POST /api/plan call the litsearch pipeline once per
hypothesis (cached in-process), adapt the FinalOutput to our locked schema,
and fall back to mocks on any exception so the demo never breaks.
"""
import logging
import os

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

import adapter
import cache
from agent.litsearch.config import ANTHROPIC_API_KEY
from mocks import MOCK_PLAN, MOCK_QC
from schemas import HypothesisRequest, LiteratureQC, Plan

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("faraday")
ALLOW_MOCK_FALLBACK = os.getenv("ALLOW_MOCK_FALLBACK", "").lower() in {"1", "true", "yes", "on"}

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
    if not ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is missing. Set it in backend/.env to run live generation."
        )
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
        if ALLOW_MOCK_FALLBACK:
            log.warning("qc fallback to mock: %s", e, exc_info=True)
            return LiteratureQC(**MOCK_QC)
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/plan", response_model=Plan)
def plan(req: HypothesisRequest) -> Plan:
    try:
        final, _ = _run_or_cached(req.hypothesis)
        return Plan(**adapter.adapt_plan(final))
    except Exception as e:
        if ALLOW_MOCK_FALLBACK:
            log.warning("plan fallback to mock: %s", e, exc_info=True)
            return Plan(**MOCK_PLAN)
        raise HTTPException(status_code=500, detail=str(e)) from e
