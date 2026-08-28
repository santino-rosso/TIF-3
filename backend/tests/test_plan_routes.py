import asyncio
import json
from datetime import datetime, timedelta, timezone

from app.models.plan_model import PlanUsuario, TipoPlan
from app.routers import plan_routes


class UpdateResult:
    def __init__(self, modified_count):
        self.modified_count = modified_count


def response_json(response):
    return json.loads(response.body.decode("utf-8"))


def test_actualizar_plan_rechaza_premium_sin_actualizar_usuario(monkeypatch):
    async def fail_actualizar_plan_usuario(*args, **kwargs):
        raise AssertionError("premium self-upgrade should not update the user plan")

    async def fail_crear_plan_usuario(*args, **kwargs):
        raise AssertionError("premium self-upgrade should not create a user plan")

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fail_actualizar_plan_usuario,
    )
    monkeypatch.setattr(plan_routes, "crear_plan_usuario", fail_crear_plan_usuario)

    response = asyncio.run(
        plan_routes.actualizar_plan(
            TipoPlan.PREMIUM.value,
            current_user={"email": "user@example.com"},
            payment_data=None,
        )
    )

    assert response.status_code == 400
    assert response_json(response) == {
        "error": "Se requieren datos de tarjeta para actualizar a Premium"
    }


def test_actualizar_plan_mantiene_tipo_invalido_como_400(monkeypatch):
    async def fail_actualizar_plan_usuario(*args, **kwargs):
        raise AssertionError("invalid plan types should not update the user plan")

    async def fail_crear_plan_usuario(*args, **kwargs):
        raise AssertionError("invalid plan types should not create a user plan")

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fail_actualizar_plan_usuario,
    )
    monkeypatch.setattr(plan_routes, "crear_plan_usuario", fail_crear_plan_usuario)

    response = asyncio.run(
        plan_routes.actualizar_plan(
            "enterprise",
            current_user={"email": "user@example.com"},
        )
    )

    assert response.status_code == 400
    assert response_json(response) == {"error": "Tipo de plan inválido"}


def test_actualizar_plan_permite_gratuito_usando_helper_compartido(monkeypatch):
    updates = []
    created = []
    inicio = datetime(2026, 8, 13, 12, tzinfo=timezone.utc)
    helper_plan = PlanUsuario(
        tipo_plan=TipoPlan.GRATUITO,
        generaciones_usadas=0,
        fecha_inicio_periodo=inicio,
        fecha_fin_periodo=inicio + timedelta(days=30),
        activo=True,
    )

    async def fake_crear_plan_usuario(tipo_plan):
        created.append(tipo_plan)
        return helper_plan

    async def fake_actualizar_plan_usuario(email, plan):
        updates.append((email, plan))
        return UpdateResult(modified_count=1)

    monkeypatch.setattr(
        plan_routes,
        "actualizar_plan_usuario",
        fake_actualizar_plan_usuario,
    )
    monkeypatch.setattr(plan_routes, "crear_plan_usuario", fake_crear_plan_usuario)

    response = asyncio.run(
        plan_routes.actualizar_plan(
            TipoPlan.GRATUITO.value,
            current_user={"email": "user@example.com"},
        )
    )

    assert response["mensaje"] == "Plan actualizado a gratuito exitosamente"
    assert response["plan"]["tipo_plan"] == TipoPlan.GRATUITO.value
    assert response["plan"] == helper_plan.model_dump()
    assert created == [TipoPlan.GRATUITO]
    assert len(updates) == 1
    assert updates[0][0] == "user@example.com"
    assert updates[0][1] is helper_plan
