"""Worker dependency registry and readiness reporting."""

from __future__ import annotations

import asyncio
from typing import Any

from aiServices.app.config.settings import WorkerConfig
from aiServices.app.api.responses import WorkerHttpError
from aiServices.app.embeddings.provider import EmbeddingUnavailable
from aiServices.app.llm.ollama import OllamaTimeout, OllamaUnavailable


class WorkerRuntime:
    def __init__(self, config: WorkerConfig, embedding_provider: Any = None, ollama_client: Any = None):
        self.config = config
        self.embedding_provider = embedding_provider
        self.ollama_client = ollama_client

    @staticmethod
    def _readiness(component: Any, default: dict[str, Any]) -> dict[str, Any]:
        if component is None:
            return default
        try:
            result = component.readiness()
        except Exception:
            return {**default, "status": "unavailable"}
        return result if isinstance(result, dict) else default

    def health(self) -> dict[str, Any]:
        embedding = self._readiness(
            self.embedding_provider,
            {"status": "not_configured", "model": self.config.embedding_model},
        )
        ollama = self._readiness(
            self.ollama_client,
            {"status": "not_configured", "model": self.config.llm_model},
        )
        return {
            "status": "ready",
            "service": "atlas-private-ai-worker",
            "binding": self.config.host,
            "embedding": embedding,
            "ollama": ollama,
        }

    async def embed(self, texts: list[str]) -> dict[str, Any]:
        if self.embedding_provider is None:
            raise WorkerHttpError(503, "EMBEDDING_UNAVAILABLE", "Embedding provider is not configured")
        try:
            vectors = await asyncio.wait_for(
                asyncio.to_thread(self.embedding_provider.embed, texts),
                timeout=self.config.embedding_timeout_seconds,
            )
        except asyncio.CancelledError:
            raise
        except asyncio.TimeoutError as exc:
            raise WorkerHttpError(504, "TIMEOUT", "Embedding request timed out") from exc
        except EmbeddingUnavailable as exc:
            raise WorkerHttpError(503, "EMBEDDING_UNAVAILABLE", str(exc)) from exc
        except ValueError as exc:
            raise WorkerHttpError(400, "VALIDATION_ERROR", str(exc)) from exc
        return {
            "model": self.config.embedding_model,
            "dimensions": self.config.embedding_dimensions,
            "embeddings": vectors,
        }

    async def generate(self, prompt: str, system: str | None = None) -> dict[str, Any]:
        if self.ollama_client is None:
            raise WorkerHttpError(503, "MODEL_UNAVAILABLE", "Ollama client is not configured")
        try:
            result = await self.ollama_client.generate(prompt, system)
        except asyncio.CancelledError:
            raise
        except OllamaTimeout as exc:
            raise WorkerHttpError(504, "TIMEOUT", "Local model request timed out") from exc
        except OllamaUnavailable as exc:
            raise WorkerHttpError(503, "MODEL_UNAVAILABLE", str(exc)) from exc
        except ValueError as exc:
            raise WorkerHttpError(400, "VALIDATION_ERROR", str(exc)) from exc
        return result
