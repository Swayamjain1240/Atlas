from fastapi.testclient import TestClient

from aiServices.app.main import create_app
from aiServices.app.services.runtime import WorkerRuntime

from .conftest import worker_environment


class FakeEmbeddings:
    def readiness(self):
        return {"status": "ready", "model": "fake", "dimensions": 384}

    def embed(self, texts):
        return [[0.0] * 384 for _ in texts]


class FakeOllama:
    def readiness(self):
        return {"status": "ready", "model": "fake"}

    async def generate(self, prompt, system=None):
        return {"text": "local answer", "model": "fake", "done": True}


def test_worker_requires_internal_auth_and_serves_embed_generate():
    config = worker_environment()
    client = TestClient(create_app(config, WorkerRuntime(config, FakeEmbeddings(), FakeOllama())))
    headers = {"Authorization": "Bearer internal-token-123456"}

    assert client.get("/internal/health").status_code == 401
    health = client.get("/internal/health", headers=headers)
    embed = client.post("/internal/embed", headers=headers, json={"texts": ["hello"]})
    generate = client.post("/internal/generate", headers=headers, json={"prompt": "hello"})

    assert health.status_code == 200
    assert embed.status_code == 200
    assert embed.json()["data"]["dimensions"] == 384
    assert len(embed.json()["data"]["embeddings"][0]) == 384
    assert generate.status_code == 200
    assert generate.json()["data"]["text"] == "local answer"


def test_worker_rejects_extra_fields_and_empty_prompt():
    config = worker_environment()
    client = TestClient(create_app(config, WorkerRuntime(config, FakeEmbeddings(), FakeOllama())))
    headers = {"Authorization": "Bearer internal-token-123456"}

    extra = client.post("/internal/generate", headers=headers, json={"prompt": "x", "extra": True})
    empty = client.post("/internal/generate", headers=headers, json={"prompt": " "})
    assert extra.status_code == 422
    assert empty.status_code == 422
    assert extra.json()["error"]["code"] == "VALIDATION_ERROR"
