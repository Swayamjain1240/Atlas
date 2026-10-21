# Legacy test-path compatibility

The canonical legacy FastAPI smoke suite is under
`tests/backend/legacy_fastapi/`. These small wrappers keep the pre-A.2
`pytest backend/tests/` command working while callers migrate to the approved
top-level test boundary.
