"""
Atlas — Personal Life OS
Main server entry point.
"""

import sys
import logging
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Depends

from src.config import config
from src.security import setup_security, verify_api_key, check_rate_limit
from src.api import api_response

# ── Logging ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if config.debug else logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("atlas")

# ── App Factory ─────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Atlas — Personal Life OS",
        description="Your local-first, AI-powered personal knowledge system.",
        version="0.1.0",
        docs_url="/docs" if config.debug else None,
        redoc_url="/redoc" if config.debug else None,
    )

    # Apply security middleware
    setup_security(app)

    # ── Health (no auth required) ──
    @app.get("/api/v1/health")
    async def health():
        return api_response({
            "status": "running",
            "version": "0.1.0",
            "privacy_mode": config.privacy_mode,
            "model": config.llm_model,
        })

    # ── Protected status endpoint ──
    @app.get("/api/v1/status")
    async def status(
        _auth: bool = Depends(verify_api_key),
        _rate: None = Depends(check_rate_limit),
    ):
        return api_response({
            "name": "Atlas",
            "version": "0.1.0",
            "uptime_seconds": 0,
            "config": repr(config),
        })

    # ── Root ──
    @app.get("/")
    async def root():
        return api_response({
            "name": "Atlas — Personal Life OS",
            "version": "0.1.0",
            "docs": "/docs" if config.debug else None,
        })

    # ── Startup ──
    @app.on_event("startup")
    async def startup():
        config.ensure_dirs()
        issues = config.validate()
        for issue in issues:
            logger.warning(issue)
        logger.info(f"🧠 Atlas starting — {config}")
        logger.info(f"📁 Data: {config.data_dir}")
        if config.debug:
            logger.warning("⚠️  DEBUG MODE — do not use in production")

    return app


# Create the application instance
app = create_app()


# ── Entry Point ─────────────────────────────────────────────────────────
def main():
    """Run the server."""
    config.ensure_dirs()
    uvicorn.run(
        "src.main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level="debug" if config.debug else "info",
    )


if __name__ == "__main__":
    main()
