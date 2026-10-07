"""
Smoke tests for Part 1 — verify the foundation works.
Run: pytest backend/tests/ -v
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client."""
    from src.main import app
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Auth headers with test API key."""
    from src.config import config
    return {"Authorization": f"Bearer {config.api_key}"}


# ── Health Endpoint ─────────────────────────────────────


class TestHealth:
    """Health endpoint is public, no auth needed."""

    def test_health_endpoint_exists(self, client):
        res = client.get("/api/v1/health")
        assert res.status_code == 200

    def test_health_returns_success_format(self, client):
        res = client.get("/api/v1/health")
        data = res.json()
        assert data["success"] is True
        assert "data" in data

    def test_health_returns_status(self, client):
        res = client.get("/api/v1/health")
        data = res.json()["data"]
        assert data["status"] == "running"
        assert data["version"] == "0.1.0"


# ── Security: Auth Required ───────────────────────────


class TestAuth:
    """Protected endpoints must require API key."""

    def test_status_requires_auth(self, client):
        res = client.get("/api/v1/status")
        assert res.status_code == 401

    def test_status_accepts_valid_key(self, client, auth_headers):
        res = client.get("/api/v1/status", headers=auth_headers)
        assert res.status_code == 200

    def test_invalid_key_rejected(self, client):
        res = client.get(
            "/api/v1/status",
            headers={"Authorization": "Bearer wrong-key"},
        )
        assert res.status_code == 401


# ── Security: Headers ─────────────────────────────────


class TestSecurityHeaders:
    """All responses must include security headers."""

    def test_csp_header_present(self, client):
        res = client.get("/api/v1/health")
        assert "content-security-policy" in res.headers

    def test_xframe_header_present(self, client):
        res = client.get("/api/v1/health")
        assert res.headers.get("x-frame-options") == "DENY"

    def test_xcontenttype_header_present(self, client):
        res = client.get("/api/v1/health")
        assert res.headers.get("x-content-type-options") == "nosniff"


# ── Config ────────────────────────────────────────────


class TestConfig:
    """Configuration module basics."""

    def test_config_loads(self):
        from src.config import config
        assert config is not None
        assert config.host
        assert config.port > 0

    def test_config_has_api_key(self):
        from src.config import config
        assert config.api_key
        assert len(config.api_key) >= 16

    def test_config_creates_dirs(self):
        from src.config import config
        config.ensure_dirs()
        assert config.data_dir.exists()
        assert config.db_dir.exists()


# ── Input Sanitizer ───────────────────────────────────


class TestSanitizer:
    """Input sanitizer blocks XSS and validates input."""

    def test_empty_query_rejected(self):
        from src.security import InputSanitizer
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            InputSanitizer.sanitize_query("")

    def test_long_query_rejected(self):
        from src.security import InputSanitizer
        from fastapi import HTTPException
        long = "a" * 3000
        with pytest.raises(HTTPException):
            InputSanitizer.sanitize_query(long)

    def test_xss_pattern_rejected(self):
        from src.security import InputSanitizer
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            InputSanitizer.sanitize_query("<script>alert(1)</script>")

    def test_valid_query_accepted(self):
        from src.security import InputSanitizer
        result = InputSanitizer.sanitize_query("What is AI?")
        assert result == "What is AI?"


# ── Rate Limiter ───────────────────────────────────────


class TestRateLimiter:
    """Rate limiter works correctly."""

    def test_allows_within_limit(self):
        from src.security import RateLimiter
        limiter = RateLimiter()
        for i in range(5):
            allowed, _ = limiter.check("test-key", max_requests=10)
            assert allowed is True

    def test_blocks_over_limit(self):
        from src.security import RateLimiter
        limiter = RateLimiter()
        for i in range(5):
            limiter.check("test2-key", max_requests=5)
        allowed, _ = limiter.check("test2-key", max_requests=5)
        assert allowed is False