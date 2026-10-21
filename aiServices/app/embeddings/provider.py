"""Lazy Sentence-Transformers embedding provider."""

from __future__ import annotations

import importlib.util
from typing import Any, Sequence

import numpy as np

from aiServices.app.config.settings import WorkerConfig


class EmbeddingUnavailable(RuntimeError):
    """Raised when the local embedding package/model cannot serve a request."""


class EmbeddingProvider:
    """Small provider protocol used by the worker and injectable in tests."""

    def readiness(self) -> dict[str, Any]:
        raise NotImplementedError

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        raise NotImplementedError


class SentenceTransformerEmbeddingProvider(EmbeddingProvider):
    def __init__(self, config: WorkerConfig):
        self.config = config
        self._model: Any | None = None
        self._load_error: str | None = None

    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        if self._load_error is not None:
            raise EmbeddingUnavailable(self._load_error)
        if importlib.util.find_spec("sentence_transformers") is None:
            self._load_error = "Sentence-Transformers is not installed"
            raise EmbeddingUnavailable(self._load_error)

        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.config.embedding_model)
            return self._model
        except Exception as exc:  # model download/load failures must be safe
            self._load_error = "Embedding model is unavailable locally"
            raise EmbeddingUnavailable(self._load_error) from exc

    def readiness(self) -> dict[str, Any]:
        if self._load_error:
            return {
                "status": "unavailable",
                "model": self.config.embedding_model,
                "dimensions": self.config.embedding_dimensions,
                "reason": self._load_error,
            }
        if importlib.util.find_spec("sentence_transformers") is None:
            return {
                "status": "unavailable",
                "model": self.config.embedding_model,
                "dimensions": self.config.embedding_dimensions,
                "reason": "Sentence-Transformers is not installed",
            }
        return {
            "status": "ready" if self._model is not None else "not_loaded",
            "model": self.config.embedding_model,
            "dimensions": self.config.embedding_dimensions,
        }

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts or any(not isinstance(text, str) or not text.strip() for text in texts):
            raise ValueError("texts must contain non-empty strings")
        if len(texts) > self.config.max_batch:
            raise ValueError(f"at most {self.config.max_batch} texts may be embedded at once")
        if any(len(text) > self.config.max_text_length for text in texts):
            raise ValueError(f"each text must be at most {self.config.max_text_length} characters")

        model = self._load()
        try:
            vectors = model.encode(
                list(texts),
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        except Exception as exc:
            raise EmbeddingUnavailable("Embedding model failed while encoding text") from exc

        array = np.asarray(vectors, dtype=np.float32)
        if array.ndim == 1:
            array = array.reshape(1, -1)
        if array.shape != (len(texts), self.config.embedding_dimensions):
            raise EmbeddingUnavailable("Embedding model returned an unexpected vector dimension")
        if not np.isfinite(array).all():
            raise EmbeddingUnavailable("Embedding model returned non-finite values")

        return array.tolist()
