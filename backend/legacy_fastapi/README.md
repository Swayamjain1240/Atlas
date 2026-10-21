# Preserved legacy FastAPI service

This is the v0.1 public Python service retained during the A.2 migration. It is
not the target public architecture; the future user-facing gateway belongs in
the Node.js/Express `backend/` boundary.

## Run locally

From this directory, install `requirements.txt`. The backend-specific template
is `../.env.example`; the local file is `../.env`. Set `ATLAS_API_KEY` and
export/load the values into the process before running:

```bash
python -m src.main
```

The legacy smoke suite is now maintained under
`tests/backend/legacy_fastapi/`. Its route and security behavior must remain
available until the Express replacement is verified.
