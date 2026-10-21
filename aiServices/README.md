# Atlas AI services boundary

This directory contains the private Python worker boundary required by the
approved architecture. B.2 keeps the worker loopback-only and requires a
separate internal credential for every internal request.

The worker owns embedding and local-model adapters. Ingestion, retrieval,
vector-store persistence and RAG remain later phases. The current
`backend/legacy_fastapi/src/ai/engine.py` is still a placeholder and remains
with the legacy service rather than being copied as if it were working AI code.

## Dependencies

Install the worker dependencies with:

```bash
python -m pip install -r requirements.txt
```

The Sentence-Transformers dependency is loaded lazily. The worker reports a
safe `embedding_unavailable` state when its model package or local model
weights are not installed; it never silently substitutes a fake production
embedding.
