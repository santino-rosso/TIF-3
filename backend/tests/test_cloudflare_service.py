import asyncio
import base64
import json

import pytest

from app.services import cloudflare_service


PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class FakeUrlopenResponse:
    def read(self):
        return json.dumps({"result": {"image": "aGVsbG8="}}).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_generar_imagen_cloudflare_sin_credenciales_no_llama_red(monkeypatch):
    monkeypatch.setattr(cloudflare_service.settings, "cloudflare_account_id", None)
    monkeypatch.setattr(cloudflare_service.settings, "cloudflare_api_token", None)

    result = asyncio.run(cloudflare_service.generar_imagen_cloudflare("milanesa con pure"))

    assert result is None


def test_generar_imagen_cloudflare_construye_url_con_base_configurada(monkeypatch):
    monkeypatch.setattr(cloudflare_service.settings, "cloudflare_account_id", "acct-123")
    monkeypatch.setattr(cloudflare_service.settings, "cloudflare_api_token", "token-abc")
    monkeypatch.setattr(
        cloudflare_service.settings,
        "cloudflare_api_base_url",
        "https://api.cloudflare.com/client/v4/accounts/",
    )

    captured = {}
    original_request = cloudflare_service.urllib.request.Request

    def capturing_request(url, *args, **kwargs):
        captured["url"] = url
        return original_request(url, *args, **kwargs)

    monkeypatch.setattr(cloudflare_service.urllib.request, "Request", capturing_request)
    monkeypatch.setattr(
        cloudflare_service.urllib.request,
        "urlopen",
        lambda request, timeout=60: FakeUrlopenResponse(),
    )

    result = asyncio.run(cloudflare_service.generar_imagen_cloudflare("milanesa con pure"))

    expected_url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        "acct-123/ai/run/@cf/black-forest-labs/flux-1-schnell"
    )
    assert captured["url"] == expected_url
    assert captured["url"].startswith(cloudflare_service.settings.cloudflare_api_base_url)
    assert result == b"hello"