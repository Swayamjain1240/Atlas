# Atlas — Personal Life Operating System

Atlas is a local-first Personal Life Operating System for indexing user-approved
personal content, retrieving relevant evidence and eventually answering
source-grounded questions with local models. The repository is in a staged
migration: the verified Express gateway is now the B.1 public-backend foundation,
while the legacy FastAPI service remains preserved and the private Python worker
is prepared for B.2.

## Current status

| Area | Status |
|---|---|
| A.1 repository audit and rollback baseline | Complete and verified |
| A.2 legacy migration and folder boundaries | Complete for the staged boundary move |
| Express public gateway | B.1 foundation complete and verified |
| Private AI worker, embeddings, ChromaDB and Ollama RAG | Planned for B.2–B.5 |
| React data-backed screens and functional graph | Existing scaffold; integration planned for B.6 |
| Full release, security, accessibility and performance gates | Planned for B.7 |

The current implementation does **not** yet provide the target query, ingestion,
persistence or RAG workflow. Documentation describes the target architecture;
the executable code and test results are the source of truth.

## Repository layout

```text
atlas/
├── backend/
│   ├── src/                    # Express config, security, routes, database
│   ├── package.json            # Node 20+ gateway package
│   ├── server.js              # Loopback server entrypoint
│   └── legacy_fastapi/         # Preserved v0.1 public Python service
├── aiServices/
│   └── app/                    # Reserved private Python worker modules
├── frontend/                   # React/Vite/Tailwind/Three.js scaffold
├── tests/
│   ├── backend/legacy_fastapi/ # Preserved 18-test FastAPI smoke suite
│   ├── frontend/
│   ├── aiServices/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── performance/
├── docs/                       # Architecture, requirements, design and master controls
├── scripts/                    # Development and audit scripts
├── data/                       # Local runtime data; ignored by Git
├── backend/.env.example        # Backend template; backend/.env is local-only
├── frontend/.env.example       # Frontend template; frontend/.env is local-only
├── aiServices/.env.example     # AI worker template; aiServices/.env is local-only
├── .env.example                # Index of the service-specific templates
└── README.md
```

## Run the Express gateway

### Prerequisites

- Python 3.11+
- Node.js 20+ for the target gateway/frontend work
- Ollama is required only for the future local AI workflow

The service-specific files are `backend/.env`, `frontend/.env` and
`aiServices/.env`. They are ignored by Git and contain separate settings for
each process. Start the B.1 gateway from `backend/`:

```bash
npm install
npm start
```

The gateway binds to `127.0.0.1:8741` by default. `GET /api/v1/health` is a
public liveness check; `GET /api/v1/status` requires the bearer token from
`backend/.env`. The gateway owns SQLite metadata and schema migrations but does
not yet provide ingestion or AI routes.

## Run the preserved legacy service

From `backend/legacy_fastapi/`:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env        # Windows: copy ..\.env.example ..\.env
# The current legacy service reads process environment variables; load/export
# backend/.env before starting it. Set ATLAS_API_KEY before use.
python -m src.main
```

The preserved service binds to `127.0.0.1:8741` by default and exposes the
legacy health, status and root endpoints. It remains available until the
Express replacement has verified contract and regression coverage.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite proxy points at the B.1 Express gateway on port 8741. Frontend query
and ingestion routes remain future B.2-B.6 work.

## Tests and checks

Run the B.1 gateway tests from `backend/`:

```bash
npm test
```

Run the preserved backend smoke suite from the repository root:

```bash
python -m pytest tests/backend/legacy_fastapi/ -v
python -m compileall -q backend/legacy_fastapi/src
sh scripts/pre-commit-hook.sh
```

The frontend build requires installed npm dependencies:

```bash
cd frontend
npm run build
```

## Security and privacy boundary

- Local user content is not uploaded or sent to hosted inference by the target
  design.
- The legacy service retains its v0.1 authentication, validation, CORS, rate
  limiting and security-header helpers, with known target gaps recorded in the
  control documents.
- `backend/` owns public authentication, authorization, validation and SQLite
  writes in the B.1 foundation.
- `aiServices/` will own private embeddings, ingestion, retrieval, ChromaDB and
  Ollama calls after B.2–B.5.
- `backend/.env`, `frontend/.env`, `aiServices/.env`, `data/`, `.atlas/` and
  credential files are ignored by Git.
- No source or personal data was deleted during A.1 or A.2.

## Migration guardrails

The approved roadmap and acceptance criteria are in `docs/atlas_master.md`,
`docs/atlas_architecture.md`, `docs/atlas_system_design.md` and
`docs/atlas_requirements.md`. Do not remove the legacy service or start B.2
implementation until the next Duck checkpoint and explicit phase authorization.

## License

MIT License — see `LICENSE`.
