# Faraday

> AI physicist that turns a hypothesis into a literature-grounded experiment plan.

**Live demo →** [faraday-research.vercel.app](https://faraday-research.vercel.app)

Faraday takes a natural-language scientific hypothesis and produces a
structured experiment plan in seconds — protocol steps, materials,
budget, timeline, and validation criteria — with every supporting
citation pulled live from arXiv. No fabricated references.

**Stack** Next.js 14 · FastAPI · Anthropic Claude · arXiv

---

## How it works

```
┌──────────────────────────┐                       ┌──────────────────────┐
│   Frontend  (Vercel)     │  ─── HTTPS ─────────▶ │   Backend (Railway)  │
│   Next.js 14 · App Rtr   │      POST /api/qc     │   FastAPI · Py 3.11+ │
│   TypeScript · Tailwind  │      POST /api/plan   │   Pydantic v2        │
│   shadcn/ui              │      GET  /health     │   Anthropic SDK      │
└──────────────────────────┘                       └──────────┬───────────┘
                                                              │
                                                       arXiv search API
```

The litsearch pipeline lives in `backend/agent/litsearch/` and runs:
query extraction → arXiv search → ranking → summarization → structured
plan generation. The full JSON contract is locked in
[`schema.md`](./schema.md); `frontend/lib/types.ts` and
`backend/schemas.py` mirror it field-for-field.

---

## Local development

Two terminals.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
uvicorn main:app --reload
# → http://localhost:8000   (interactive docs at /docs)
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:3456
```

If the backend is unreachable, the frontend falls back to mock data
in `frontend/lib/mock-data.ts` so the UI keeps working during a demo.
The backend has a matching opt-in fallback when `ALLOW_MOCK_FALLBACK=1`.

---

## Deploy

### Frontend → Vercel

1. Connect the repo. Vercel auto-detects Next.js.
2. **Settings → General → Root Directory** → `frontend`.
3. **Environment Variables** → `NEXT_PUBLIC_API_URL` = your backend URL
   (e.g. `https://faraday-backend.up.railway.app`).
4. Deploy.

### Backend → Railway

1. Connect the repo as a new service.
2. **Settings → Service → Root Directory** → `backend`.
3. **Variables**:
   - `ANTHROPIC_API_KEY` — required.
   - `ALLOW_MOCK_FALLBACK=1` — optional, returns mocks instead of 500s
     on pipeline errors. Useful for demos.
4. Railway uses Nixpacks and the start command in `railway.json`:
   `uvicorn main:app --host 0.0.0.0 --port $PORT`. A `Procfile` is
   included as a fallback.

CORS is preconfigured for `localhost:3456` and any `*.vercel.app`
origin. For a custom domain, extend `allow_origins` in
`backend/main.py`.

---

## Project layout

```
faraday/
├── frontend/                  Next.js 14 · TS · Tailwind · shadcn/ui
├── backend/
│   ├── main.py                FastAPI app (POST /api/qc, /api/plan, GET /health)
│   ├── adapter.py             Pipeline output → schema.md shape
│   ├── cache.py               In-process per-hypothesis cache
│   ├── schemas.py             Pydantic v2 models (mirrors schema.md)
│   └── agent/litsearch/       Query → arXiv → rank → summarize → plan
├── schema.md                  Locked JSON contract
└── README.md
```

---

## Schema contract

The full JSON contract lives in [`schema.md`](./schema.md). Both
`frontend/lib/types.ts` (TypeScript) and `backend/schemas.py`
(Pydantic v2) mirror it field-for-field. **Do not rename fields
without updating both sides and `schema.md` in the same change.**

---

## API

| Method | Path        | Body                       | Response       |
| ------ | ----------- | -------------------------- | -------------- |
| POST   | `/api/qc`   | `{ "hypothesis": string }` | `LiteratureQC` |
| POST   | `/api/plan` | `{ "hypothesis": string }` | `Plan`         |
| GET    | `/health`   | —                          | `{ status }`   |

Both POST endpoints share a per-hypothesis pipeline cache, so a `/qc`
call followed by `/plan` for the same hypothesis reuses one pipeline
run. See `/docs` for the live OpenAPI spec.

---

## Origin

Built at Hack-Nation 2026, Zurich Hub.
