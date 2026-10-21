"""Standard response and error primitives for the private worker."""

from __future__ import annotations

import re
import time
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,100}$")
API_VERSION = "0.2.0"


class WorkerHttpError(Exception):
    """An expected, safe error that can be returned to the internal caller."""

    def __init__(self, status_code: int, code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


def ensure_request_context(request: Request) -> str:
    request_id = request.headers.get("X-Request-ID", "")
    if not REQUEST_ID_PATTERN.fullmatch(request_id):
        request_id = str(uuid4())
    request.state.request_id = request_id
    request.state.started_at = time.perf_counter()
    return request_id


def response_meta(request: Request) -> dict[str, Any]:
    started_at = getattr(request.state, "started_at", time.perf_counter())
    return {
        "request_id": getattr(request.state, "request_id", "unknown"),
        "processing_time_ms": round((time.perf_counter() - started_at) * 1000, 3),
        "version": API_VERSION,
    }


def success_response(request: Request, data: Any) -> dict[str, Any]:
    return {"success": True, "data": data, "meta": response_meta(request)}


def failure_response(
    request: Request,
    code: str,
    message: str,
    details: Any = None,
) -> dict[str, Any]:
    error: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error["details"] = details
    return {"success": False, "error": error, "meta": response_meta(request)}


def validation_details(exc: RequestValidationError) -> list[dict[str, str]]:
    return [
        {"path": ".".join(str(part) for part in issue["loc"]), "message": issue["msg"]}
        for issue in exc.errors()
    ]


async def request_context_middleware(request: Request, call_next):
    request_id = ensure_request_context(request)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


async def worker_http_error_handler(request: Request, exc: WorkerHttpError):
    return JSONResponse(
        status_code=exc.status_code,
        content=failure_response(request, exc.code, exc.message, exc.details),
    )


async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=failure_response(
            request,
            "VALIDATION_ERROR",
            "The request failed validation",
            validation_details(exc),
        ),
    )


async def http_error_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else None
    code = detail.get("code", "HTTP_ERROR") if detail else "HTTP_ERROR"
    message = detail.get("message", "Request failed") if detail else "Request failed"
    return JSONResponse(
        status_code=exc.status_code,
        content=failure_response(request, code, message),
        headers=exc.headers,
    )


async def unhandled_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=failure_response(request, "INTERNAL_ERROR", "An internal error occurred"),
    )
