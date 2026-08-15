import asyncio
import base64
import json

import pytest

from app.services import gemini_service
from app.services import cloudflare_service


class FailingModels:
    def generate_content(self, *args, **kwargs):
        raise RuntimeError("gemini unavailable")


class FailingClient:
    models = FailingModels()


def test_generar_receta_gemini_lanza_error_interno_si_falla_modelo(monkeypatch):
    monkeypatch.setattr(gemini_service, "client", FailingClient())

    with pytest.raises(gemini_service.GeminiGenerationError) as exc_info:
        asyncio.run(gemini_service.generar_receta_gemini("prompt"))

    assert str(exc_info.value) == "Error al generar receta."


def test_validar_y_adaptar_receta_con_gemini_lanza_error_interno_si_falla_modelo(monkeypatch):
    monkeypatch.setattr(gemini_service, "client", FailingClient())

    with pytest.raises(gemini_service.GeminiGenerationError) as exc_info:
        asyncio.run(gemini_service.validar_y_adaptar_receta_con_gemini("prompt"))

    assert str(exc_info.value) == "Error al validar y adaptar receta."


def test_generar_imagen_receta_cloudflare_sin_credenciales_no_llama_red(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "image_generation_provider", "cloudflare")
    monkeypatch.setattr(gemini_service.settings, "cloudflare_account_id", None)
    monkeypatch.setattr(gemini_service.settings, "cloudflare_api_token", None)

    async def fail_cloudflare(*args, **kwargs):
        raise AssertionError("network call should not happen")

    monkeypatch.setattr(cloudflare_service, "generar_imagen_cloudflare", fail_cloudflare)

    result = asyncio.run(gemini_service.generar_imagen_receta("milanesa con pure"))

    assert result is None


PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class FakeImageFile:
    async def read(self):
        return PNG_1PX


def test_detectar_ingredientes_gemini_devuelve_mensaje_generico_si_falla_modelo(monkeypatch):
    monkeypatch.setattr(gemini_service, "client", FailingClient())

    result = asyncio.run(
        gemini_service.detectar_ingredientes_gemini(
            prompt="prompt",
            imagen_file=FakeImageFile(),
        )
    )

    assert result.startswith("Error al identificar ingredientes")
    assert "gemini unavailable" not in result


class FakeUrlopenResponse:
    def read(self):
        return json.dumps({"result": {"image": "aGVsbG8="}}).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


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
