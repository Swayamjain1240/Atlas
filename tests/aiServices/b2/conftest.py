"""Shared fixtures for B.2 private-worker tests."""

from aiServices.app.config.settings import load_config


def worker_environment(**overrides):
    values = {
        "NODE_ENV": "test",
        "AI_SERVICE_INTERNAL_TOKEN": "internal-token-123456",
        "AI_SERVICE_HOST": "127.0.0.1",
        "AI_SERVICE_PORT": "8750",
        "ATLAS_LLM_MODEL": "llama3.2:3b",
        "ATLAS_EMBEDDING_MODEL": "all-MiniLM-L6-v2",
        "ATLAS_LOG_LEVEL": "TEST",
    }
    values.update(overrides)
    return load_config(values)
