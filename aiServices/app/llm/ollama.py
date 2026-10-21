"""Cancellable, loopback-only Ollama HTTP adapter."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

import httpx

from aiServices.app.config.settings import WorkerConfig


class OllamaUnavailable(RuntimeError):
    """Raised when Ollama cannot serve a local request."""


class OllamaTimeout(OllamaUnavailable):
    """Raised when Ollama exceeds the configured request timeout."""


class OllamaClient:
    def __init__(
        self,
        config: WorkerConfig,
        client_factory: Callable[..., httpx.AsyncClient] | None = None,
    ):
        self.config = config
        self._client_factory = client_factory or httpx.AsyncClient
        self._last_error: str | None = None

    def readiness(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "status": "not_checked",
            "model": self.config.llm_model,
            "url": self.config.ollama_url,
        }
        if self._last_error:
            result["status"] = "unavailable"
            result["reason"] = self._last_error
        return result

    async def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        timeout_seconds: float | None = None,
    ) -> dict[str, Any]:
        timeout = timeout_seconds or self.config.ollama_timeout_seconds
        try:
            async with asyncio.timeout(timeout):
                async with self._client_factory(
                    base_url=self.config.ollama_url,
                    timeout=httpx.Timeout(timeout),
                ) as client:
                    response = await client.request(method, path, json=payload)
        except asyncio.CancelledError:
            raise
        except (TimeoutError, httpx.TimeoutException) as exc:
            self._last_error = "Ollama request timed out"
            raise OllamaTimeout(self._last_error) from exc
        except httpx.RequestError as exc:
            self._last_error = "Ollama is unavailable"
            raise OllamaUnavailable(self._last_error) from exc

        if response.status_code >= 400:
            self._last_error = "Ollama returned an error"
            raise OllamaUnavailable(self._last_error)
        try:
            result = response.json()
        except ValueError as exc:
            self._last_error = "Ollama returned invalid JSON"
            raise OllamaUnavailable(self._last_error) from exc
        if not isinstance(result, dict):
            self._last_error = "Ollama returned an invalid response"
            raise OllamaUnavailable(self._last_error)
        self._last_error = None
        return result

    async def check_ready(self) -> dict[str, Any]:
        payload = await self._request("GET", "/api/tags", timeout_seconds=self.config.request_timeout_seconds)
        models = payload.get("models", [])
        available = {
            item.get("name")
            for item in models
            if isinstance(item, dict) and isinstance(item.get("name"), str)
        }
        model_available = self.config.llm_model in available
        return {
            "status": "ready" if model_available else "model_unavailable",
            "model": self.config.llm_model,
            "model_available": model_available,
        }

    async def generate(self, prompt: str, system: str | None = None) -> dict[str, Any]:
        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")
        if len(prompt) > self.config.max_text_length:
            raise ValueError(f"prompt must be at most {self.config.max_text_length} characters")
        if system is not None and len(system) > self.config.max_text_length:
            raise ValueError(f"system prompt must be at most {self.config.max_text_length} characters")

        options = {
            "temperature": self.config.llm_temperature,
            "num_predict": self.config.llm_max_tokens,
        }
        payload: dict[str, Any] = {
            "model": self.config.llm_model,
            "prompt": prompt,
            "stream": False,
            "options": options,
        }
        if system:
            payload["system"] = system

        result = await self._request("POST", "/api/generate", payload)
        answer = result.get("response")
        if not isinstance(answer, str):
            self._last_error = "Ollama response did not contain text"
            raise OllamaUnavailable(self._last_error)
        return {
            "text": answer,
            "model": result.get("model", self.config.llm_model),
            "done": bool(result.get("done", False)),
            "prompt_eval_count": result.get("prompt_eval_count"),
            "eval_count": result.get("eval_count"),
        }
