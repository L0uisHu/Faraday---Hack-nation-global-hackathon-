# litsearch/arxiv_search.py

import arxiv
from .schemas import SearchIntent, Paper


def search_arxiv(
    search_intent: SearchIntent,
    max_results_per_query: int = 10,
) -> list[Paper]:
    client = arxiv.Client()
    papers_by_url = {}

    for query in search_intent.search_queries:
        search = arxiv.Search(
            query=query,
            max_results=max_results_per_query,
            sort_by=arxiv.SortCriterion.Relevance,
        )

        for result in client.results(search):
            paper = Paper(
                title=result.title,
                authors=[author.name for author in result.authors],
                abstract=result.summary,
                published=str(result.published.date()),
                url=result.entry_id,
                pdf_url=result.pdf_url,
                categories=result.categories,
            )

            papers_by_url[paper.url] = paper

    return list(papers_by_url.values())