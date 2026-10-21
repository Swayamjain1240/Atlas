import pytest
import numpy as np

from aiServices.app.embeddings.provider import (
    EmbeddingUnavailable,
    SentenceTransformerEmbeddingProvider,
)

from .conftest import worker_environment


def test_embedding_provider_reports_missing_optional_runtime_safely():
    provider = SentenceTransformerEmbeddingProvider(worker_environment())
    readiness = provider.readiness()
    assert readiness["dimensions"] == 384
    if readiness["status"] == "unavailable":
        with pytest.raises(EmbeddingUnavailable):
            provider.embed(["hello"])


def test_embedding_provider_enforces_384_dimension_output():
    provider = SentenceTransformerEmbeddingProvider(worker_environment())

    class FakeModel:
        def encode(self, texts, **kwargs):
            return np.zeros((len(texts), 384), dtype=np.float32)

    provider._load = lambda: FakeModel()
    vectors = provider.embed(["hello", "world"])
    assert len(vectors) == 2
    assert len(vectors[0]) == 384


def test_embedding_provider_rejects_empty_text():
    provider = SentenceTransformerEmbeddingProvider(worker_environment())
    with pytest.raises(ValueError, match="non-empty"):
        provider.embed([" "])
