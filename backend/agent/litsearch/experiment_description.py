# litsearch/experiment_description.py

from .schemas import Paper, ExperimentDescription
from .structured_llm import claude_parse


EXPERIMENT_DESCRIPTION_PROMPT = """
You describe the experiment or study requested by the user.

This is not a paper summary.

Your task is to infer the experiment the user wants to perform, using:
1. the user's original prompt
2. the most relevant retrieved papers

Describe the proposed experiment clearly and concretely.

Rules:
- Focus on the user's requested experiment, not on summarizing papers one by one.
- Use the papers only as context for what has already been done.
- Do not invent precise numerical values unless they are in the user's prompt or strongly supported by the retrieved papers.
- If important details are missing, state them as limitations.
- For particle physics, identify the process, observable, perturbative accuracy, dataset or simulation input, and validation target.
- For wet-lab biology, identify the system, intervention, control, measured outcome, and validation method.
"""


def describe_requested_experiment(
    user_prompt: str,
    top_papers: list[Paper],
) -> ExperimentDescription:
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

Relevant literature:
{paper_payload}
"""

    return claude_parse(
        system_prompt=EXPERIMENT_DESCRIPTION_PROMPT,
        user_prompt=prompt,
        response_model=ExperimentDescription,
    )