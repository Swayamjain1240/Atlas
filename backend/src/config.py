"""
Atlas Configuration
Central config with environment variable validation.
All secrets loaded from environment — NEVER hardcoded.
"""

import os
import secrets
from pathlib import Path


class AtlasConfig:
    """Immutable configuration loaded from environment variables."""

    def __init__(self):
        # ── Required: fail fast if missing ──
        self.api_key = os.getenv("ATLAS_API_KEY", "")
        if not self.api_key:
            generated = secrets.token_urlsafe(32)
            print(f"⚠️  ATLAS_API_KEY not set. Generated temporary key: {generated}")
            print(f"   Set it in .env or export ATLAS_API_KEY='<your-key>'")
            self.api_key = generated

        # ── Ollama (Local LLM) ──
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.llm_model = os.getenv("ATLAS_LLM_MODEL", "llama3.2:3b")
        self.llm_temperature = float(os.getenv("ATLAS_LLM_TEMP", "0.1"))
        self.llm_max_tokens = int(os.getenv("ATLAS_LLM_MAX_TOKENS", "4096"))

        # ── Server ──
        self.host = os.getenv("ATLAS_HOST", "127.0.0.1")
        self.port = int(os.getenv("ATLAS_PORT", "8741"))
        self.debug = os.getenv("ATLAS_DEBUG", "false").lower() == "true"

        # ── Embedding ──
        self.embedding_model = os.getenv(
            "ATLAS_EMBEDDING_MODEL", "all-MiniLM-L6-v2"
        )

        # ── Privacy ──
        self.privacy_mode = os.getenv("ATLAS_PRIVACY", "local").lower()

        # ── Paths ──
        data_dir_env = os.getenv("ATLAS_DATA_DIR", "")
        self.data_dir = Path(data_dir_env) if data_dir_env else Path.home() / ".atlas"
        self.db_dir = Path(os.getenv("ATLAS_DB_DIR", str(self.data_dir / "db")))
        self.log_dir = Path(os.getenv("ATLAS_LOG_DIR", str(self.data_dir / "logs")))
        self.cache_dir = Path(os.getenv("ATLAS_CACHE_DIR", str(self.data_dir / "cache")))

        # ── CORS ──
        self.cors_origins = os.getenv(
            "ATLAS_CORS_ORIGINS",
            "http://localhost:5173,http://localhost:8741",
        ).split(",")

        # ── Rate Limiting ──
        self.rate_limit_per_minute = int(os.getenv("ATLAS_RATE_LIMIT", "100"))

        # ── Security ──
        self.auto_approve_apis = (
            os.getenv("ATLAS_AUTO_APPROVE_API", "false").lower() == "true"
        )

    def ensure_dirs(self):
        """Create required directories."""
        for d in [self.data_dir, self.db_dir, self.log_dir, self.cache_dir]:
            d.mkdir(parents=True, exist_ok=True)

    @property
    def vector_db_path(self) -> str:
        return str(self.db_dir / "vectors.chroma")

    @property
    def sqlite_path(self) -> str:
        return str(self.db_dir / "atlas.db")

    def validate(self) -> list[str]:
        """Validate config and return list of warnings/errors."""
        issues = []
        if self.debug:
            issues.append("⚠️  Debug mode is ON — disable for production use")
        if self.port < 1024 and os.name != "nt":
            issues.append(f"⚠️  Port {self.port} requires root on Linux/macOS")
        if self.privacy_mode not in ("local", "hybrid"):
            issues.append("⚠️  ATLAS_PRIVACY must be 'local' or 'hybrid'")
        return issues

    def __repr__(self) -> str:
        return (
            f"AtlasConfig(host={self.host}, port={self.port}, "
            f"model={self.llm_model}, privacy={self.privacy_mode})"
        )


# Singleton
config = AtlasConfig()
