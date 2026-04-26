"""In-process cache: hypothesis -> (FinalOutput, retrieved_papers).

Why: run_pipeline does ~7 sequential LLM calls (30-120s). The frontend hits
/api/qc then /api/plan back-to-back with the same hypothesis. Without caching,
the user pays the pipeline cost twice. We hash the hypothesis (sha256 of
trimmed lowercased text) and stash the full result on first call.

Process restart wipes it. Not multi-process safe, not size-bounded — both
acceptable for the hackathon.
"""
import hashlib

from agent.litsearch.schemas import FinalOutput, Paper

_CACHE: dict[str, tuple[FinalOutput, list[Paper]]] = {}


def _key(hypothesis: str) -> str:
    return hashlib.sha256(hypothesis.strip().lower().encode("utf-8")).hexdigest()


def get(hypothesis: str) -> tuple[FinalOutput, list[Paper]] | None:
    return _CACHE.get(_key(hypothesis))


def put(hypothesis: str, value: tuple[FinalOutput, list[Paper]]) -> None:
    _CACHE[_key(hypothesis)] = value
