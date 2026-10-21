"""Compatibility fixtures for the pre-A.2 test path."""

import os
import sys
from pathlib import Path


legacy_root = Path(__file__).resolve().parents[1] / "legacy_fastapi"
sys.path.insert(0, str(legacy_root))

os.environ["ATLAS_API_KEY"] = "test-api-key-do-not-use-in-prod"
os.environ["ATLAS_DEBUG"] = "true"
os.environ["ATLAS_PRIVACY"] = "local"
