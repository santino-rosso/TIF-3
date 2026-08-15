import asyncio
import base64

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