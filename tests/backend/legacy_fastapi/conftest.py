"""
Test configuration and utilities.
"""

import sys
from pathlib import Path

# Add the preserved legacy FastAPI package to the import path.
legacy_root = Path(__file__).resolve().parents[3] / "backend" / "legacy_fastapi"
sys.path.insert(0, str(legacy_root))

# Test fixtures and helpers
import os

# Test API key for tests
TEST_API_KEY = "test-api-key-do-not-use-in-prod"
os.environ["ATLAS_API_KEY"] = TEST_API_KEY
os.environ["ATLAS_DEBUG"] = "true"
os.environ["ATLAS_PRIVACY"] = "local"
