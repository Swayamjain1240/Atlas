"""
Test configuration and utilities.
"""

import sys
from pathlib import Path

# Add backend src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Test fixtures and helpers
import os

# Test API key for tests
TEST_API_KEY = "test-api-key-do-not-use-in-prod"
os.environ["ATLAS_API_KEY"] = TEST_API_KEY
os.environ["ATLAS_DEBUG"] = "true"
os.environ["ATLAS_PRIVACY"] = "local"