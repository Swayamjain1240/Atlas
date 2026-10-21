"""Validated configuration for the private Atlas AI worker."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})
EXPECTED_EMBEDDING_DIMENSIONS = 384


class ConfigError(ValueError):
    """Raised when worker configuration would violate the trust boundary."""


def _text(environment: dict[str, str], key: str, default: str = "") -> str:
    return str(environment.get(key, default)).strip()


def _required(environment: dict[str, str], key: str, minimum: int = 1) -> str:
    value = _text(environment, key)
    if len(value) < minimum:
        raise ConfigError(f"{key} must be at least {minimum} characters")
    return value


def _integer(environment: dict[str, str], key: str, default: int, minimum: int, maximum: int) -> int:
    raw = _text(environment, key, str(default))
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigError(f"{key} must be an integer") from exc
    if value < minimum or value > maximum:
        raise ConfigError(f"{key} must be between {minimum} and {maximum}")
    return value


def _number(environment: dict[str, str], key: str, default: float, minimum: float, maximum: float) -> float:
    raw = _text(environment, key, str(default))
    try:
        value = float(raw)
    except ValueError as exc:
        raise ConfigError(f"{key} must be numeric") from exc
    if value < minimum or value > maximum:
        raise ConfigError(f"{key} must be between {minimum} and {maximum}")
    return value


def _boolean(environment: dict[str, str], key: str, default: bool) -> bool:
    raw = _text(environment, key, str(default).lower()).lower()
    if raw not in {"true", "false"}:
        raise ConfigError(f"{key} must be true or false")
    return raw == "true"


def _loopback_url(environment: dict[str, str], key: str, default: str) -> str:
    value = _text(environment, key, default)
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in LOOPBACK_HOSTS:
        raise ConfigError(f"{key} must use an HTTP(S) loopback URL")
    if parsed.username or parsed.password:
        raise ConfigError(f"{key} must not contain embedded credentials")
    return value.rstrip("/")


def _path(environment: dict[str, str], key: str, default: Path) -> Path:
    value = _text(environment, key)
    return Path(value).expanduser().resolve() if value else default.expanduser().resolve()


@dataclass(frozen=True, slots=True)
class WorkerConfig:
    host: str
    port: int
    internal_token: str
    ollama_url: str
    llm_model: str
    llm_temperature: float
    llm_max_tokens: int
    embedding_model: str
    embedding_dimensions: int
    request_timeout_seconds: float
    embedding_timeout_seconds: float
    ollama_timeout_seconds: float
    max_batch: int
    max_text_length: int
    data_dir: Path
    vector_db_dir: Path
    log_level: str
    docs_enabled: bool


def load_config(environment: dict[str, str] | None = None) -> WorkerConfig:
    values = dict(os.environ if environment is None else environment)
    host = _text(values, "AI_SERVICE_HOST", "127.0.0.1")
    if host not in LOOPBACK_HOSTS:
        raise ConfigError("AI_SERVICE_HOST must bind to loopback")

    dimensions = _integer(
        values,
        "AI_SERVICE_EMBEDDING_DIMENSIONS",
        EXPECTED_EMBEDDING_DIMENSIONS,
        EXPECTED_EMBEDDING_DIMENSIONS,
        EXPECTED_EMBEDDING_DIMENSIONS,
    )
    data_dir = _path(values, "ATLAS_DATA_DIR", Path.home() / ".atlas")

    return WorkerConfig(
        host=host,
        port=_integer(values, "AI_SERVICE_PORT", 8750, 1, 65535),
        internal_token=_required(values, "AI_SERVICE_INTERNAL_TOKEN", 16),
        ollama_url=_loopback_url(values, "OLLAMA_URL", "http://127.0.0.1:11434"),
        llm_model=_required(values, "ATLAS_LLM_MODEL", 1),
        llm_temperature=_number(values, "ATLAS_LLM_TEMP", 0.1, 0.0, 2.0),
        llm_max_tokens=_integer(values, "ATLAS_LLM_MAX_TOKENS", 4096, 1, 32768),
        embedding_model=_required(values, "ATLAS_EMBEDDING_MODEL", 1),
        embedding_dimensions=dimensions,
        request_timeout_seconds=_number(values, "AI_SERVICE_REQUEST_TIMEOUT", 10.0, 0.1, 300.0),
        embedding_timeout_seconds=_number(values, "AI_SERVICE_EMBED_TIMEOUT", 60.0, 0.1, 900.0),
        ollama_timeout_seconds=_number(values, "AI_SERVICE_OLLAMA_TIMEOUT", 30.0, 0.1, 900.0),
        max_batch=_integer(values, "AI_SERVICE_MAX_BATCH", 128, 1, 1024),
        max_text_length=_integer(values, "AI_SERVICE_MAX_TEXT_LENGTH", 12000, 1, 1000000),
        data_dir=data_dir,
        vector_db_dir=_path(values, "ATLAS_VECTOR_DB_DIR", data_dir / "vectors"),
        log_level=_text(values, "ATLAS_LOG_LEVEL", "INFO").upper(),
        docs_enabled=_boolean(values, "AI_SERVICE_DOCS", False),
    )
