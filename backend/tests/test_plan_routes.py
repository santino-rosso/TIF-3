import asyncio
import json

from app.models.plan_model import TipoPlan
from app.routers import plan_routes


class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


def response_json(response):
    return json.loads(response.body.decode("utf-8"))


def test_actualizar_plan_rechaza_premium_sin_actualizar_usuario(monkeypatch):
    async def fail_actualizar_plan_usuario(*args, **kwargs):
        raise AssertionError("premium self-upgrade should not update the user plan")

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fail_actualizar_plan_usuario,
    )

    response = asyncio.run(
        plan_routes.actualizar_plan(
            TipoPlan.PREMIUM.value,
            current_user={"email": "user@example.com"},
        )
    )

    assert response.status_code == 403
    assert response_json(response) == {
        "error": "No se permite actualizar a premium desde este endpoint"
    }


def test_actualizar_plan_mantiene_tipo_invalido_como_400(monkeypatch):
    async def fail_actualizar_plan_usuario(*args, **kwargs):
        raise AssertionError("invalid plan types should not update the user plan")

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fail_actualizar_plan_usuario,
    )

    response = asyncio.run(
        plan_routes.actualizar_plan(
            "enterprise",
            current_user={"email": "user@example.com"},
        )
    )

    assert response.status_code == 400
    assert response_json(response) == {"error": "Tipo de plan inválido"}


def test_actualizar_plan_permite_gratuito(monkeypatch):
    updates = []

    async def fake_actualizar_plan_usuario(email, plan):
        updates.append((email, plan))
        return UpdateResult(modified_count=1)

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fake_actualizar_plan_usuario,
    )

    response = asyncio.run(
        plan_routes.actualizar_plan(
            TipoPlan.GRATUITO.value,
            current_user={"email": "user@example.com"},
        )
    )

    assert response["mensaje"] == "Plan actualizado a gratuito exitosamente"
    assert response["plan"]["tipo_plan"] == TipoPlan.GRATUITO.value
    assert len(updates) == 1
    assert updates[0][0] == "user@example.com"
    assert updates[0][1].tipo_plan == TipoPlan.GRATUITO
    assert updates[0][1].generaciones_usadas == 0
