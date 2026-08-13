import asyncio

from app.services import gemini_service


def test_generar_imagen_receta_cloudflare_sin_credenciales_no_llama_red(monkeypatch):
    monkeypatch.setattr(gemini_service.settings, "image_generation_provider", "cloudflare")
    monkeypatch.setattr(gemini_service.settings, "cloudflare_account_id", None)
    monkeypatch.setattr(gemini_service.settings, "cloudflare_api_token", None)

    def fail_urlopen(*args, **kwargs):
        raise AssertionError("network call should not happen")

    monkeypatch.setattr(gemini_service.urllib.request, "urlopen", fail_urlopen)

    result = asyncio.run(gemini_service.generar_imagen_receta("milanesa con pure"))

    assert result is None
