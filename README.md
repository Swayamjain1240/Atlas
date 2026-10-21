# Atlas — Personal Life Operating System

Atlas is a local-first Personal Life Operating System for indexing user-approved
personal content, retrieving relevant evidence and eventually answering
source-grounded questions with local models. The repository is in a staged
migration: the existing FastAPI service is preserved while the approved
Express gateway and private Python worker are prepared.

## Current status

| Area | Status |
|---|---|
| A.1 repository audit and rollback baseline | Complete and verified |
| A.2 legacy migration and folder boundaries | Complete for the staged boundary move |
| Express public gateway | Planned for B.1 |
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
│   ├── src/                    # Reserved Node.js/Express gateway modules
│   ├── package.json            # Node 20+ boundary metadata
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

## Run the preserved legacy service

### Prerequisites

- Python 3.11+
- Node.js 20+ for the target gateway/frontend work
- Ollama is required only for the future local AI workflow

The service-specific files are `backend/.env`, `frontend/.env` and
`aiServices/.env`. They are ignored by Git and contain separate settings for
each process. From `backend/legacy_fastapi/`:

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

The Vite proxy currently points at the preserved service on port 8741. The
Express gateway will become the public API owner in B.1; no frontend proxy or
API contract switch is made in A.2.

## Tests and checks

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
- `backend/` will own public authentication, authorization, validation and
  SQLite writes after B.1.
- `aiServices/` will own private embeddings, ingestion, retrieval, ChromaDB and
  Ollama calls after B.2–B.5.
- `backend/.env`, `frontend/.env`, `aiServices/.env`, `data/`, `.atlas/` and
  credential files are ignored by Git.
- No source or personal data was deleted during A.1 or A.2.

## Migration guardrails

The approved roadmap and acceptance criteria are in `docs/atlas_master.md`,
`docs/atlas_architecture.md`, `docs/atlas_system_design.md` and
`docs/atlas_requirements.md`. Do not remove the legacy service or start B.1
implementation until the next Duck checkpoint and explicit phase authorization.

## License

MIT License — see `LICENSE`.
