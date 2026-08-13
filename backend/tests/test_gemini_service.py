import asyncio

import pytest

from app.services import gemini_service


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

    def fail_urlopen(*args, **kwargs):
        raise AssertionError("network call should not happen")

    monkeypatch.setattr(gemini_service.urllib.request, "urlopen", fail_urlopen)

    result = asyncio.run(gemini_service.generar_imagen_receta("milanesa con pure"))

    assert result is None
