# litsearch/pipeline.py

from .config import MAX_RESULTS_PER_QUERY

from .schemas import LiteratureQCResult, FinalOutput
from .query_extraction import extract_search_intent
from .arxiv_search import search_arxiv
from .ranking import rank_papers
from .summarization import summarize_top_papers
from .novelty import assess_novelty
from .experiment_description import describe_requested_experiment
from .plan_generation import generate_experiment_plan
from .output_builder import build_final_output


def run_internal_literature_qc(user_prompt: str) -> LiteratureQCResult:
    """
    Internal function.

    Keeps all intermediate objects:
    - search intent
    - retrieved papers
    - ranking
    - summary
    - experiment description
    - novelty assessment
    """

    search_intent = extract_search_intent(user_prompt)

    retrieved_papers = search_arxiv(
        search_intent,
        max_results_per_query=MAX_RESULTS_PER_QUERY,
    )

    ranking = rank_papers(user_prompt, retrieved_papers)

    top_urls = {paper_score.url for paper_score in ranking.ranked_papers}

    top_papers = [
        paper for paper in retrieved_papers
        if paper.url in top_urls
    ]

    summary = summarize_top_papers(user_prompt, top_papers)

    experiment_description = describe_requested_experiment(
        user_prompt=user_prompt,
        top_papers=top_papers,
    )

    novelty = assess_novelty(user_prompt, ranking)

    return LiteratureQCResult(
        search_intent=search_intent,
        retrieved_papers=retrieved_papers,
        ranking=ranking,
        summary=summary,
        experiment_description=experiment_description,
        novelty=novelty,
    )


def run_literature_qc(user_prompt: str) -> FinalOutput:
    """
    Public function.

    Returns only:

    {
      literature_qc: { status, references },
      plan: { protocol, materials, budget, timeline, validation }
    }
    """

    internal_result = run_internal_literature_qc(user_prompt)

    top_urls = {
        paper_score.url
        for paper_score in internal_result.ranking.ranked_papers
    }

    top_papers = [
        paper
        for paper in internal_result.retrieved_papers
        if paper.url in top_urls
    ]

    plan = generate_experiment_plan(
        user_prompt=user_prompt,
        search_intent=internal_result.search_intent,
        top_papers=top_papers,
        ranking=internal_result.ranking,
        experiment_description=internal_result.experiment_description,
    )

    return build_final_output(
        internal_result=internal_result,
        plan=plan,
    )