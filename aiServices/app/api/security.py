"""Authentication for loopback-only Node-to-Python requests."""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from aiServices.app.config.settings import WorkerConfig


bearer_scheme = HTTPBearer(auto_error=False)


def _safe_equal(provided: str, expected: str) -> bool:
    return secrets.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))


def require_internal_auth(config: WorkerConfig):
    async def verify(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    ) -> bool:
        if credentials is None or credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Internal bearer token required"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not _safe_equal(credentials.credentials, config.internal_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Invalid internal credentials"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        return True

    return verify
