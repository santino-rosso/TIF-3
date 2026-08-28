import asyncio

from app.db import plan_repository
from app.models.plan_model import Plan, TipoPlan
from app.routers import plan_routes


class FakePlanesCollection:
    def __init__(self):
        self.updates = []

    async def update_one(self, filter_, update, upsert=False):
        self.updates.append((filter_, update, upsert))


class DivergentPlanesCollection:
    async def find_one(self, *args, **kwargs):
        raise AssertionError("runtime plan lookup must not read Mongo planes")


def divergent_premium_plan():
    return Plan(
        tipo=TipoPlan.PREMIUM,
        limite_generaciones_mensual=9999,
        precio=0.01,
        nombre="Divergent Premium",
        descripcion="This Mongo value must not affect runtime behavior",
    )


def test_obtener_plan_por_tipo_ignora_mongo_divergente(monkeypatch):
    monkeypatch.setattr(
        plan_repository,
        "planes_collection",
        DivergentPlanesCollection(),
    )

    result = asyncio.run(plan_repository.obtener_plan_por_tipo(TipoPlan.PREMIUM))

    assert result == plan_repository.PLANES_DISPONIBLES[TipoPlan.PREMIUM]
    assert result != divergent_premium_plan()


def test_obtener_planes_endpoint_usa_planes_canonicos(monkeypatch):
    async def fail_obtener_plan_por_tipo(*args, **kwargs):
        raise AssertionError("all plans endpoint should use canonical plan list")

    monkeypatch.setattr(
        plan_repository,
        "planes_collection",
        DivergentPlanesCollection(),
    )
    monkeypatch.setattr(
        plan_repository,
        "obtener_plan_por_tipo",
        fail_obtener_plan_por_tipo,
    )

    response = asyncio.run(plan_routes.obtener_planes())

    assert response == {
        "planes": [plan.model_dump() for plan in plan_repository.PLANES_DISPONIBLES.values()]
    }


def test_inicializar_planes_upserta_planes_canonicos(monkeypatch):
    fake_collection = FakePlanesCollection()
    monkeypatch.setattr(plan_repository, "planes_collection", fake_collection)

    asyncio.run(plan_repository.inicializar_planes())

    assert fake_collection.updates == [
        ({"tipo": plan.tipo}, {"$set": plan.model_dump()}, True)
        for plan in plan_repository.PLANES_DISPONIBLES.values()
    ]
