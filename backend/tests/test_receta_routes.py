import asyncio
import json

from app.routers import receta_routes
from app.services.gemini_service import GeminiGenerationError


def response_json(response):
    return json.loads(response.body.decode("utf-8"))


def patch_successful_quota(monkeypatch, released):
    plan_usuario = object()

    async def fake_obtener_plan_usuario(email):
        assert email == "user@example.com"
        return plan_usuario

    async def fake_puede_generar_receta(email, plan):
        assert email == "user@example.com"
        assert plan is plan_usuario
        return {"puede_generar": True, "limite": 5}

    async def fake_reservar_generacion_plan(email, plan, limite):
        assert email == "user@example.com"
        assert plan is plan_usuario
        assert limite == 5
        return True

    async def fake_liberar_generacion_plan(email, plan):
        released.append((email, plan))

    monkeypatch.setattr(receta_routes, "obtener_plan_usuario", fake_obtener_plan_usuario)
    monkeypatch.setattr(receta_routes, "puede_generar_receta", fake_puede_generar_receta)
    monkeypatch.setattr(receta_routes, "reservar_generacion_plan", fake_reservar_generacion_plan)
    monkeypatch.setattr(receta_routes, "liberar_generacion_plan", fake_liberar_generacion_plan)
    return plan_usuario


def patch_downstream_failures(monkeypatch, calls):
    async def fail_validar_y_adaptar_receta_con_gemini(*args, **kwargs):
        calls.append("validar_y_adaptar_receta_con_gemini")
        raise AssertionError("validation should not be called")

    async def fail_generar_imagen_receta(*args, **kwargs):
        calls.append("generar_imagen_receta")
        raise AssertionError("image generation should not be called")

    async def fail_buscar_recetas_similares(*args, **kwargs):
        calls.append("buscar_recetas_similares")
        raise AssertionError("similar recipe lookup should not be called")

    async def fail_guardar_receta(*args, **kwargs):
        calls.append("guardar_receta")
        raise AssertionError("recipe save should not be called")

    async def fail_registrar_generacion(*args, **kwargs):
        calls.append("registrar_generacion")
        raise AssertionError("generation register should not be called")

    def fail_generar_embedding(*args, **kwargs):
        calls.append("generar_embedding")
        raise AssertionError("embedding should not be called")

    monkeypatch.setattr(
        receta_routes,
        "validar_y_adaptar_receta_con_gemini",
        fail_validar_y_adaptar_receta_con_gemini,
    )
    monkeypatch.setattr(receta_routes, "generar_imagen_receta", fail_generar_imagen_receta)
    monkeypatch.setattr(receta_routes, "generar_embedding", fail_generar_embedding)
    monkeypatch.setattr(receta_routes, "buscar_recetas_similares", fail_buscar_recetas_similares)
    monkeypatch.setattr(receta_routes, "guardar_receta", fail_guardar_receta)
    monkeypatch.setattr(receta_routes, "registrar_generacion", fail_registrar_generacion)


def test_generar_receta_libera_cupo_y_corta_pipeline_si_falla_generacion(monkeypatch):
    released = []
    downstream_calls = []
    plan_usuario = patch_successful_quota(monkeypatch, released)
    patch_downstream_failures(monkeypatch, downstream_calls)

    async def fake_generar_receta_gemini(prompt):
        raise GeminiGenerationError("Error al generar receta.")

    monkeypatch.setattr(receta_routes, "generar_receta_gemini", fake_generar_receta_gemini)

    response = asyncio.run(
        receta_routes.generar_receta(
            ingredientes="arroz, tomate",
            current_user={"email": "user@example.com"},
        )
    )

    assert response.status_code == 500
    assert response_json(response) == {"error": "Error al generar receta."}
    assert released == [("user@example.com", plan_usuario)]
    assert downstream_calls == []


def test_generar_receta_libera_cupo_y_corta_pipeline_si_falla_validacion(monkeypatch):
    released = []
    downstream_calls = []
    plan_usuario = patch_successful_quota(monkeypatch, released)

    async def fake_generar_receta_gemini(prompt):
        return "Receta generada"

    async def fake_validar_y_adaptar_receta_con_gemini(prompt):
        raise GeminiGenerationError("Error al validar y adaptar receta.")

    async def fail_generar_imagen_receta(*args, **kwargs):
        downstream_calls.append("generar_imagen_receta")
        raise AssertionError("image generation should not be called")

    async def fail_buscar_recetas_similares(*args, **kwargs):
        downstream_calls.append("buscar_recetas_similares")
        raise AssertionError("similar recipe lookup should not be called")

    async def fail_guardar_receta(*args, **kwargs):
        downstream_calls.append("guardar_receta")
        raise AssertionError("recipe save should not be called")

    async def fail_registrar_generacion(*args, **kwargs):
        downstream_calls.append("registrar_generacion")
        raise AssertionError("generation register should not be called")

    def fail_generar_embedding(*args, **kwargs):
        downstream_calls.append("generar_embedding")
        raise AssertionError("embedding should not be called")

    monkeypatch.setattr(receta_routes, "generar_receta_gemini", fake_generar_receta_gemini)
    monkeypatch.setattr(
        receta_routes,
        "validar_y_adaptar_receta_con_gemini",
        fake_validar_y_adaptar_receta_con_gemini,
    )
    monkeypatch.setattr(receta_routes, "generar_imagen_receta", fail_generar_imagen_receta)
    monkeypatch.setattr(receta_routes, "generar_embedding", fail_generar_embedding)
    monkeypatch.setattr(receta_routes, "buscar_recetas_similares", fail_buscar_recetas_similares)
    monkeypatch.setattr(receta_routes, "guardar_receta", fail_guardar_receta)
    monkeypatch.setattr(receta_routes, "registrar_generacion", fail_registrar_generacion)

    response = asyncio.run(
        receta_routes.generar_receta(
            ingredientes="arroz, tomate",
            current_user={"email": "user@example.com"},
        )
    )

    assert response.status_code == 500
    assert response_json(response) == {"error": "Error al validar y adaptar receta."}
    assert released == [("user@example.com", plan_usuario)]
    assert downstream_calls == []
