# litsearch/plan_generation.py

from .schemas import (
    Paper,
    SearchIntent,
    RankingResult,
    ExperimentDescription,
    ExperimentPlanOutput,
)
from .structured_llm import claude_parse


PLAN_GENERATION_PROMPT = """
You generate operational experiment plans from a scientific user request.
Your output must contain:
1. protocol: step-by-step methodology
2. materials: required materials, reagents, software, datasets, or equipment
3. budget: realistic line-item cost estimate
4. timeline: phased schedule with dependencies
5. validation: how success or failure will be measured
Hard limits (must follow exactly):
- protocol: 5 to 8 steps maximum
- materials: 6 to 12 items maximum
- budget: 5 to 10 items maximum
- timeline: 4 to 6 phases maximum
- validation: 3 to 6 items maximum
- Keep each text field concise (1 to 2 sentences).
- Keep each list item practical and non-redundant.
Rules:
- Focus on the experiment requested by the user.
- Use the retrieved literature only as grounding context.
- Do not summarize papers one by one.
- Do not invent exact catalog numbers unless clearly supported.
- If the experiment is computational, materials should include software, datasets, computing resources, libraries, and benchmark results.
- If the experiment is wet-lab, materials should include reagents, biological systems, assays, instruments, and controls.
- If costs are uncertain, provide ranges and mark them as estimates.
- Make the plan realistic enough that a scientist could use it as a starting point.
- Mention limitations or assumptions inside the relevant fields.
"""


def generate_experiment_plan(
    user_prompt: str,
    search_intent: SearchIntent,
    top_papers: list[Paper],
    ranking: RankingResult,
    experiment_description: ExperimentDescription,
) -> ExperimentPlanOutput:
    paper_payload = [
        {
            "title": paper.title,
            "authors": paper.authors,
            "abstract": paper.abstract,
            "url": paper.url,
            "categories": paper.categories,
        }
        for paper in top_papers
    ]

    prompt = f"""
User request:
{user_prompt}

Extracted search intent:
{search_intent.model_dump()}

Experiment description:
{experiment_description.model_dump()}

Top relevant papers:
{paper_payload}

Ranking:
{ranking.model_dump()}

Generate a complete experiment plan.
"""

    return claude_parse(
        system_prompt=PLAN_GENERATION_PROMPT,
        user_prompt=prompt,
        response_model=ExperimentPlanOutput,
        max_tokens=3500,
    )