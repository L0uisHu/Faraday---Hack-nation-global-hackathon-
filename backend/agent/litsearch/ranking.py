# litsearch/ranking.py

from .schemas import Paper, RankingResult
from .structured_llm import claude_parse


RANKING_PROMPT = """
You are ranking arXiv papers for a scientific literature search.

Score each paper from 0 to 5:

5 = directly answers the user's request
4 = very relevant, same topic but missing one detail
3 = related background
2 = weakly related
1 = generic field match
0 = irrelevant

Return only the top 5 papers.
"""


def rank_papers(user_prompt: str, papers: list[Paper]) -> RankingResult:
    compact_papers = [
        {
            "title": paper.title,
            "abstract": paper.abstract,
            "url": paper.url,
            "categories": paper.categories,
        }
        for paper in papers
    ]

    prompt = f"""
User request:
{user_prompt}

Candidate papers:
{compact_papers}
"""

    return claude_parse(
        system_prompt=RANKING_PROMPT,
        user_prompt=prompt,
        response_model=RankingResult,
    )