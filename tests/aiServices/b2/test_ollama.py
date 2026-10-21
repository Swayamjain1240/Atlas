import asyncio

import httpx
import pytest

from aiServices.app.llm.ollama import OllamaClient, OllamaTimeout, OllamaUnavailable

from .conftest import worker_environment


def test_ollama_client_checks_model_and_generates_text():
    async def run():
        config = worker_environment()

        def handler(request):
            if request.url.path == "/api/tags":
                return httpx.Response(200, json={"models": [{"name": "llama3.2:3b"}]})
            return httpx.Response(200, json={"model": "llama3.2:3b", "response": "answer", "done": True})

        client = OllamaClient(
            config,
            lambda **kwargs: httpx.AsyncClient(transport=httpx.MockTransport(handler), **kwargs),
        )
        assert (await client.check_ready())["status"] == "ready"
        assert (await client.generate("hello"))["text"] == "answer"

    asyncio.run(run())


def test_ollama_client_maps_connection_errors_without_leaking_details():
    async def run():
        config = worker_environment()

        def handler(request):
            raise httpx.ConnectError("private test detail", request=request)

        client = OllamaClient(
            config,
            lambda **kwargs: httpx.AsyncClient(transport=httpx.MockTransport(handler), **kwargs),
        )
        with pytest.raises(OllamaUnavailable, match="unavailable"):
            await client.check_ready()
        assert "private test detail" not in str(client.readiness())

    asyncio.run(run())


def test_ollama_client_times_out_with_bounded_request():
    async def run():
        config = worker_environment(AI_SERVICE_REQUEST_TIMEOUT="0.1", AI_SERVICE_OLLAMA_TIMEOUT="0.1")

        async def handler(request):
            await asyncio.sleep(0.5)
            return httpx.Response(200, json={"models": []})

        client = OllamaClient(
            config,
            lambda **kwargs: httpx.AsyncClient(transport=httpx.MockTransport(handler), **kwargs),
        )
        with pytest.raises(OllamaTimeout):
            await client.check_ready()

    asyncio.run(run())
