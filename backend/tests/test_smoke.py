"""Compatibility wrapper for the preserved legacy smoke suite."""

from pathlib import Path


canonical_test = (
    Path(__file__).resolve().parents[2]
    / "tests"
    / "backend"
    / "legacy_fastapi"
    / "test_smoke.py"
)
exec(compile(canonical_test.read_text(encoding="utf-8"), str(canonical_test), "exec"))
