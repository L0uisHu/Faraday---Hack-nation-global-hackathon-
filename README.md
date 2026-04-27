<div align="center">

# Faraday

**AI physicist that turns a hypothesis into a literature-grounded experiment plan.**

[**Live demo →**](https://faraday-research.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Anthropic](https://img.shields.io/badge/Anthropic-Claude-d97757)](https://anthropic.com)
[![arXiv](https://img.shields.io/badge/source-arXiv-b31b1b)](https://arxiv.org)

</div>

---

## What it is

Faraday takes a single sentence — a research hypothesis written in plain English — and produces a complete experimental plan in under a minute: an ordered protocol, the materials and budget you'd need, a Gantt timeline of the work, and the validation criteria that would make the result publishable. Every claim it makes is grounded in a live arXiv search, so the references it shows you are real papers you can open, not LLM-invented DOIs.

It's built for the moment a researcher has an idea and wants to see whether it's worth chasing — before spending a week writing the proposal.

## Why it's different

Most "AI scientist" tools either generate plausible-looking research without sources, or pretend to cite while quietly hallucinating titles, authors, and DOIs. Faraday's pipeline is the opposite. It starts from arXiv: it searches and ranks real papers against the hypothesis, summarizes what they actually say, and only then asks the model to generate the plan. If a citation appears in the output, it points at a paper that exists.

The plan itself isn't a wall of text either. It loads as an interactive document — protocol steps, resources, and budget are all inline-editable, and the Gantt timeline supports drag-and-resize so you can adjust the schedule as you read. Edits persist across reloads, so a researcher can shape the plan in place instead of rewriting it elsewhere.

## How it works

```
Frontend (Vercel)        ───── HTTPS ─────▶        Backend (Railway)
Next.js 14 · App Router                            FastAPI · Pydantic v2
TypeScript · Tailwind                              Anthropic Claude
                                                           │
                                                   arXiv search API
```

When you submit a hypothesis, the backend runs a five-stage pipeline: it extracts search queries from your sentence, hits the arXiv API for candidate papers, ranks them for relevance, summarizes the most relevant ones, and feeds the summaries into Claude to generate a structured plan. The output flows back to the frontend through a strict JSON contract that the UI renders piece by piece — protocol, resources, budget, timeline, and validation each get their own card.

If the backend is ever down or rate-limited, the frontend falls back to mock data instead of crashing, so the demo survives a flaky network.

## Stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Frontend | Next.js 14 · TypeScript · Tailwind · shadcn/ui · Vercel  |
| Backend  | FastAPI · Python 3.11+ · Pydantic v2 · Railway           |
| AI       | Anthropic Claude                                         |
| Data     | arXiv                                                    |

---

## Origin

Built at Hack-Nation 2026, Zurich Hub.
