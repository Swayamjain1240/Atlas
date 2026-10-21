# Atlas AI services boundary

This directory reserves the private Python worker boundary required by the
approved architecture. The worker is not implemented in A.2 and must remain
loopback-only with a separate internal credential when B.2 begins.

Reusable AI, ingestion, retrieval, embedding, vector-store and Ollama code may
move here only after its callers and tests are identified. The current
`backend/legacy_fastapi/src/ai/engine.py` is a placeholder and remains with the
legacy service rather than being copied as if it were a working implementation.
