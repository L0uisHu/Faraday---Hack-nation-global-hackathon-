# litsearch/output_builder.py

from .schemas import (
    LiteratureQCResult,
    LiteratureQCOutput,
    LiteratureReference,
    ExperimentPlanOutput,
    FinalOutput,
)


def build_literature_qc_output(
    internal_result: LiteratureQCResult,
) -> LiteratureQCOutput:
    references = []

    for paper_score in internal_result.ranking.ranked_papers:
        if paper_score.relevance_score >= 3:
            references.append(
                LiteratureReference(
                    title=paper_score.title,
                    url=paper_score.url,
                    relevance_score=paper_score.relevance_score,
                    reason=paper_score.reason,
                )
            )

    return LiteratureQCOutput(
        status=internal_result.novelty.novelty_signal,
        references=references,
    )


def build_final_output(
    internal_result: LiteratureQCResult,
    plan: ExperimentPlanOutput,
) -> FinalOutput:
    literature_qc = build_literature_qc_output(internal_result)

    return FinalOutput(
        literature_qc=literature_qc,
        plan=plan,
    )