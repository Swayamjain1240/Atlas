"""
Atlas Security Module
Authentication, authorization, CORS, rate limiting, input sanitization.
All security concerns centralized here — not scattered across routes.
"""

import re
import time
import hashlib
import logging
from typing import Dict, Optional, Tuple
from collections import defaultdict

from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import config

logger = logging.getLogger("atlas.security")

# ── Auth Scheme ──────────────────────────────────────────────────────────
security_scheme = HTTPBearer(auto_error=False)

# ── Rate Limiter ──────────────────────────────���──────────────────────────
class RateLimiter:
    """Sliding window rate limiter — per IP, per route."""

    def __init__(self):
        self._windows: Dict[str, list] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_sec: int = 60) -> Tuple[bool, int]:
        """
        Check if request is allowed.
        Returns (allowed, remaining).
        """
        now = time.time()
        cutoff = now - window_sec

        # Prune old entries
        self._windows[key] = [t for t in self._windows[key] if t > cutoff]

        if len(self._windows[key]) >= max_requests:
            return False, 0

        self._windows[key].append(now)
        return True, max_requests - len(self._windows[key])

    def get_remaining(self, key: str, max_requests: int) -> int:
        now = time.time()
        cutoff = now - 60
        self._windows[key] = [t for t in self._windows[key] if t > cutoff]
        return max(0, max_requests - len(self._windows[key]))


rate_limiter = RateLimiter()


# ── Input Sanitizer ──────────────────────────────────────────────────────
class InputSanitizer:
    """Validate and sanitize user inputs."""

    MAX_QUERY_LENGTH = 2000
    MAX_SOURCE_LENGTH = 100
    BLOCKED_PATTERNS = [
        re.compile(r"<script[^>]*>", re.IGNORECASE),
        re.compile(r"javascript:", re.IGNORECASE),
        re.compile(r"onerror\s*=", re.IGNORECASE),
        re.compile(r"onload\s*=", re.IGNORECASE),
    ]

    @classmethod
    def sanitize_query(cls, query: str) -> str:
        """Sanitize a user query string."""
        if not query or not query.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "EMPTY_QUERY", "message": "Query cannot be empty"},
            )
        if len(query) > cls.MAX_QUERY_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "QUERY_TOO_LONG",
                    "message": f"Query exceeds {cls.MAX_QUERY_LENGTH} characters",
                },
            )
        for pattern in cls.BLOCKED_PATTERNS:
            if pattern.search(query):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "BLOCKED_CONTENT", "message": "Query contains blocked patterns"},
                )
        return query.strip()

    @classmethod
    def sanitize_source(cls, source: Optional[str]) -> Optional[str]:
        """Validate source filter."""
        if source is None:
            return None
        allowed = {"file", "browser", "message", "email", "code"}
        source = source.strip().lower()
        if source not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_SOURCE",
                    "message": f"Source must be one of: {', '.join(sorted(allowed))}",
                },
            )
        return source


# ── Authentication Dependency ────────────────────────────────────────────
async def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> bool:
    """
    Verify API key from Authorization header.
    Returns True if authenticated.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_AUTH", "message": "Authorization header required"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Constant-time comparison to prevent timing attacks
    provided = credentials.credentials
    expected = config.api_key

    if len(provided) != len(expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_KEY", "message": "Invalid API key"},
        )

    # Constant time compare
    result = 0
    for a, b in zip(provided, expected):
        result |= ord(a) ^ ord(b)
    if result != 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_KEY", "message": "Invalid API key"},
        )

    return True


# ── Optional Auth (for public endpoints) ─────────────────────────────────
async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> bool:
    """Optional auth — doesn't fail if no key provided."""
    if not credentials:
        return False
    try:
        return await verify_api_key(credentials)
    except HTTPException:
        return False


# ── Rate Limiting Dependency ─────────────────────────────────────────────
async def check_rate_limit(request: Request):
    """Rate limiting dependency."""
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    key = f"{client_ip}:{path}"

    allowed, remaining = rate_limiter.check(key, config.rate_limit_per_minute)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": f"Rate limit exceeded. Max {config.rate_limit_per_minute} requests/minute.",
            },
        )


# ── Middleware: Security Headers ─────────────────────────────────────────
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' http://localhost:11434; "
        "img-src 'self' data: blob:; "
        "worker-src 'self' blob:;"
    ),
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Server": "Atlas/0.1.0",
}


async def security_headers_middleware(request: Request, call_next):
    """Add security headers to every response."""
    try:
        response = await call_next(request)
    except HTTPException as exc:
        response = JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": exc.detail},
        )
    except Exception as exc:
        logger.exception("Unhandled error")
        response = JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {"code": "INTERNAL_ERROR", "message": "An internal error occurred"},
            },
        )

    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value

    # Add CORS headers
    origin = request.headers.get("origin", "")
    if origin in config.cors_origins or "*" in config.cors_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Credentials"] = "true"

    return response


# ── Setup Function ───────────────────────────────────────────────────────
def setup_security(app):
    """Configure all security middleware on the FastAPI app."""
    from fastapi.middleware.cors import CORSMiddleware

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    # Security headers middleware
    app.middleware("http")(security_headers_middleware)

    logger.info(f"[Security] configured - CORS: {config.cors_origins}")
    logger.info(f"[Security] API key auth: enabled")
    logger.info(f"[Security] Rate limit: {config.rate_limit_per_minute}/min")

    return app
