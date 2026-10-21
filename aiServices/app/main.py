"""FastAPI application factory for the private Atlas AI worker."""

from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from aiServices.app.api.responses import (
    WorkerHttpError,
    http_error_handler,
    request_context_middleware,
    success_response,
    unhandled_error_handler,
    validation_error_handler,
    worker_http_error_handler,
)
from aiServices.app.api.security import require_internal_auth
from aiServices.app.config.settings import LOOPBACK_HOSTS, WorkerConfig
from aiServices.app.services.runtime import WorkerRuntime


def create_app(config: WorkerConfig, runtime: WorkerRuntime | None = None) -> FastAPI:
    worker_runtime = runtime or WorkerRuntime(config)
    app = FastAPI(
        title="Atlas Private AI Worker",
        version="0.2.0",
        docs_url="/docs" if config.docs_enabled else None,
        redoc_url="/redoc" if config.docs_enabled else None,
        openapi_url="/openapi.json" if config.docs_enabled else None,
    )
    app.state.config = config
    app.state.runtime = worker_runtime

    app.add_exception_handler(WorkerHttpError, worker_http_error_handler)
    app.add_exception_handler(HTTPException, http_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
    app.middleware("http")(request_context_middleware)

    allowed_hosts = set(LOOPBACK_HOSTS)
    if config.docs_enabled or config.log_level == "TEST":
        allowed_hosts.add("testserver")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(allowed_hosts))

    internal_auth = require_internal_auth(config)

    @app.get("/internal/health", dependencies=[Depends(internal_auth)])
    async def health(request: Request):
        return success_response(request, worker_runtime.health())

    return app
