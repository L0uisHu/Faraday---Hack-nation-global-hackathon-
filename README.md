# Faraday

> The AI co-scientist, grounded in real research.

Faraday turns a natural-language scientific hypothesis into a fully
grounded, runnable experiment plan in seconds — with real protocols,
real catalog numbers, and real citations.

Built at **Hack-Nation 2026, Zurich Hub**.

---

## Architecture

```
┌──────────────────────┐        HTTPS          ┌──────────────────────┐
│   Frontend (Vercel)  │ ────────────────────▶ │  Backend (Railway)   │
│   Next.js 14         │   POST /api/qc        │  FastAPI · Python    │
│   App Router · TS    │   POST /api/plan      │  Pydantic v2         │
│   Tailwind · shadcn  │   GET  /health        │  Anthropic SDK       │
└──────────────────────┘                       └──────────────────────┘
```

The contract between the two apps is locked in [`schema.md`](./schema.md).
Both `frontend/lib/types.ts` (TypeScript) and `backend/schemas.py`
(Pydantic v2) mirror that schema field-for-field.

---

## Local development

Two terminals.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000   (docs at /docs)
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:3456
```

If the backend is down or unreachable, the frontend automatically falls
back to mock data in `frontend/lib/mock-data.ts` so the demo never breaks.

---

## Deploy

### Frontend → Vercel

1. Connect the GitHub repo to Vercel.
2. **Project Settings → General → Root Directory** → set to `frontend`.
3. **Environment Variables** → add `NEXT_PUBLIC_API_URL` pointing at
   your Railway backend URL (e.g. `https://faraday-backend.up.railway.app`).
4. Deploy.

### Backend → Railway

1. Connect the GitHub repo to Railway as a new service.
2. **Settings → Service → Root Directory** → set to `backend`.
3. **Variables** → add `ANTHROPIC_API_KEY`.
4. Railway uses Nixpacks + the `railway.json` start command:
   `uvicorn main:app --host 0.0.0.0 --port $PORT`.
   A `Procfile` is included as a fallback.

CORS is preconfigured to allow `localhost:3456` and any `*.vercel.app`
origin.

---

## Schema

The full JSON contract lives in [`schema.md`](./schema.md). Both the
frontend and backend models reference it directly. Do not rename
fields without updating both sides and `schema.md` in the same change.

---

## Project structure

```
faraday/
├── frontend/         Next.js 14 (App Router, TS, Tailwind, shadcn)
├── backend/          FastAPI (Python 3.11+, Pydantic v2)
├── schema.md         Locked JSON contract
└── README.md
```

Both apps ship with mock data wired into the endpoints. The agent seam
lives in `backend/agent/__init__.py` — a `generate_plan(hypothesis)`
stub that gets replaced with real Anthropic agent logic without
touching the schema or endpoint signatures.

---

## Team

_Faraday team — Hack-Nation 2026 Zurich Hub._
