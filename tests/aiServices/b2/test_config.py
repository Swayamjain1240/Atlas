import pytest

from aiServices.app.config.settings import ConfigError, load_config

from .conftest import worker_environment


def test_worker_configuration_requires_separate_internal_token():
    with pytest.raises(ConfigError, match="AI_SERVICE_INTERNAL_TOKEN"):
        worker_environment(AI_SERVICE_INTERNAL_TOKEN="short")


def test_worker_configuration_rejects_non_loopback_trust_boundaries():
    with pytest.raises(ConfigError, match="loopback"):
        worker_environment(AI_SERVICE_HOST="0.0.0.0")
    with pytest.raises(ConfigError, match="loopback URL"):
        worker_environment(OLLAMA_URL="https://ollama.example.com")


def test_worker_configuration_locks_embedding_dimensions_to_384():
    with pytest.raises(ConfigError, match="between 384 and 384"):
        worker_environment(AI_SERVICE_EMBEDDING_DIMENSIONS="768")
