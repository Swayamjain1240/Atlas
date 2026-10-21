# Atlas backend boundary

This directory is the approved home for the future Node.js/Express public gateway.
The gateway is intentionally not implemented in Migration A.2; its runtime,
dependencies and contracts are part of Rebuild B.1.

The previous public FastAPI service is preserved at `backend/legacy_fastapi/` so
the existing behavior remains available while the Express replacement is built
and verified. Do not delete or repurpose that compatibility tree until the
replacement passes its contract, security and regression checks.

The `src/` subdirectories are reserved for the B.1 route, controller, middleware,
service, database, model, validator and utility boundaries.
