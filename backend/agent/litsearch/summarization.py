# litsearch/summarization.py

from .schemas import Paper
from .structured_llm import claude_text


SUMMARY_PROMPT = """
You summarize scientific papers specifically with respect to the user's question.

For each paper, explain:
1. What the paper studies
2. Why it is relevant
3. What useful information it contains
4. Whether it is an exact match, similar work, or only background
"""


def summarize_top_papers(user_prompt: str, top_papers: list[Paper]) -> str:
    paper_payload = [
        {
            "title": paper.title,
            "authors": paper.authors,
            "abstract": paper.abstract,
            "url": paper.url,
        }
        for paper in top_papers
    ]

    prompt = f"""
User question:
{user_prompt}

Papers:
{paper_payload}
"""

    return claude_text(
        system_prompt=SUMMARY_PROMPT,
        user_prompt=prompt,
    )