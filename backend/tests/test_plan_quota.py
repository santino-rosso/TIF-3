import asyncio
from datetime import datetime, timedelta, timezone

from app.db import plan_repository, user_repository
from app.models.plan_model import PlanUsuario, TipoPlan


class FakeGeneracionesCollection:
    def __init__(self, count):
        self.count = count
        self.filters = []

    async def count_documents(self, filter_):
        self.filters.append(filter_)
        return self.count


class FakeUsuariosCollection:
    def __init__(self):
        self.updates = []

    async def update_one(self, filter_, update):
        self.updates.append((filter_, update))


def crear_plan(generaciones_usadas=2):
    inicio = datetime(2026, 8, 1, 12, tzinfo=timezone.utc)
    return PlanUsuario(
        tipo_plan=TipoPlan.GRATUITO,
        generaciones_usadas=generaciones_usadas,
        fecha_inicio_periodo=inicio,
        fecha_fin_periodo=inicio + timedelta(days=30),
    )


def test_obtener_generaciones_periodo_actual_usa_maximo_y_limites(monkeypatch):
    fake_collection = FakeGeneracionesCollection(count=4)
    monkeypatch.setattr(plan_repository, "generaciones_collection", fake_collection)
    plan = crear_plan(generaciones_usadas=2)

    result = asyncio.run(
        plan_repository.obtener_generaciones_periodo_actual("user@example.com", plan)
    )

    assert result == 4
    assert fake_collection.filters == [
        {
            "usuario_email": "user@example.com",
            "fecha_generacion": {
                "$gte": plan.fecha_inicio_periodo,
                "$lt": plan.fecha_fin_periodo,
            },
        }
    ]


def test_obtener_generaciones_periodo_actual_no_reduce_contador_plan(monkeypatch):
    fake_collection = FakeGeneracionesCollection(count=1)
    monkeypatch.setattr(plan_repository, "generaciones_collection", fake_collection)
    plan = crear_plan(generaciones_usadas=3)

    result = asyncio.run(
        plan_repository.obtener_generaciones_periodo_actual("user@example.com", plan)
    )

    assert result == 3


def test_sincronizar_generaciones_plan_actualiza_solo_si_historico_supera_embebido(monkeypatch):
    fake_collection = FakeUsuariosCollection()
    monkeypatch.setattr(user_repository, "usuarios_collection", fake_collection)

    async def fake_obtener_generaciones_periodo_actual(email, plan_usuario):
        assert email == "user@example.com"
        assert plan_usuario.generaciones_usadas == 2
        return 5

    monkeypatch.setattr(
        user_repository,
        "obtener_generaciones_periodo_actual",
        fake_obtener_generaciones_periodo_actual,
    )
    plan = crear_plan(generaciones_usadas=2)

    result = asyncio.run(
        user_repository.sincronizar_generaciones_plan("user@example.com", plan)
    )

    assert result.generaciones_usadas == 5
    assert fake_collection.updates == [
        (
            user_repository.filtro_plan_periodo("user@example.com", plan),
            {"$set": {"plan.generaciones_usadas": 5}},
        )
    ]


def test_sincronizar_generaciones_plan_no_actualiza_si_embebido_alcanza(monkeypatch):
    fake_collection = FakeUsuariosCollection()
    monkeypatch.setattr(user_repository, "usuarios_collection", fake_collection)

    async def fake_obtener_generaciones_periodo_actual(email, plan_usuario):
        return 2

    monkeypatch.setattr(
        user_repository,
        "obtener_generaciones_periodo_actual",
        fake_obtener_generaciones_periodo_actual,
    )
    plan = crear_plan(generaciones_usadas=2)

    result = asyncio.run(
        user_repository.sincronizar_generaciones_plan("user@example.com", plan)
    )

    assert result.generaciones_usadas == 2
    assert fake_collection.updates == []
