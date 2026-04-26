# litsearch/query_extraction.py

from .schemas import SearchIntent
from .structured_llm import claude_parse


EXTRACTION_PROMPT = """
You are a scientific literature-search assistant.

Given the user's natural-language scientific question, extract a structured search intent.

Rules:
1. Extract concrete scientific entities, methods, observables, and outcomes.
2. Preserve technical notation when useful.
3. Add synonyms that are actually used in the literature.
4. Do not invent details that are not implied by the prompt.
5. Generate 5 high-quality arXiv search queries.
6. Prefer specific queries first, then broader fallback queries.
"""


def extract_search_intent(user_prompt: str) -> SearchIntent:
    return claude_parse(
        system_prompt=EXTRACTION_PROMPT,
        user_prompt=user_prompt,
        response_model=SearchIntent,
    )