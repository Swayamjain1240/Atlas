"""Worker dependency registry and readiness reporting."""

from __future__ import annotations

from typing import Any

from aiServices.app.config.settings import WorkerConfig


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
