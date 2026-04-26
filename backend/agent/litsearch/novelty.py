# litsearch/novelty.py

from .schemas import RankingResult, NoveltyAssessment
from .structured_llm import claude_parse


NOVELTY_PROMPT = """
You are performing a fast literature quality-control check.

Classify the result as exactly one of:
- exact match found
- similar work exists
- not found

Use "exact match found" only if the same system/process, method, and observable are present.
Use "similar work exists" if the topic is clearly related but not identical.
Use "not found" if none of the papers are strongly relevant.
"""


def assess_novelty(
    user_prompt: str,
    ranking: RankingResult,
) -> NoveltyAssessment:
    prompt = f"""
User proposed study:
{user_prompt}

Ranked papers:
{ranking.model_dump()}
"""

    return claude_parse(
        system_prompt=NOVELTY_PROMPT,
        user_prompt=prompt,
        response_model=NoveltyAssessment,
    )