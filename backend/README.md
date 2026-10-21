# Atlas backend

This directory contains the B.1 Node.js/Express public gateway foundation.
It binds to loopback by default, validates its environment, authenticates
protected routes, enforces exact-origin CORS and rate limits, and owns the
SQLite metadata migration foundation.

The previous public FastAPI service is preserved at `backend/legacy_fastapi/` so
the existing behavior remains available while the Express replacement is built
and verified. Do not delete or repurpose that compatibility tree until the
replacement passes its contract, security and regression checks.

## Run

```bash
npm install
npm start
```

Use `npm run dev` for Node's watch mode and `npm test` for the B.1 contract and
security suite. Copy `.env.example` to `.env` and set `ATLAS_API_KEY` before
starting the service.

## B.1 routes

- `GET /api/v1/health` — public liveness and database readiness.
- `GET /api/v1/status` — authenticated component status; send
  `Authorization: Bearer <ATLAS_API_KEY>`.

Ingestion, query, memory and AI-worker routes remain future B.2-B.5 work. The
legacy FastAPI service remains at `backend/legacy_fastapi/` until the replacement
workflow is verified.
