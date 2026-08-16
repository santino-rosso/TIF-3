import asyncio
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import create_access_token

client = TestClient(app)


def create_admin_token():
    return create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})


def create_user_token():
    return create_access_token({"sub": "user@test.com", "is_admin": False, "is_active": True})


def create_inactive_token():
    return create_access_token({"sub": "inactive@test.com", "is_admin": True, "is_active": False})


def mock_admin_user():
    return {
        "email": "admin@test.com",
        "hashed_password": "hashed",
        "is_admin": True,
        "is_active": True,
        "favoritos": [],
        "plan": {"tipo_plan": "premium"},
        "creado_en": "2024-01-01T00:00:00"
    }


def mock_regular_user():
    return {
        "email": "user@test.com",
        "hashed_password": "hashed",
        "is_admin": False,
        "is_active": True,
        "favoritos": [],
        "plan": {"tipo_plan": "gratuito"},
        "creado_en": "2024-01-01T00:00:00"
    }


def mock_inactive_user():
    return {
        "email": "inactive@test.com",
        "hashed_password": "hashed",
        "is_admin": True,
        "is_active": False,
        "favoritos": [],
        "plan": {"tipo_plan": "premium"},
        "creado_en": "2024-01-01T00:00:00"
    }


@pytest.fixture(autouse=True)
def mock_user_lookup(monkeypatch):
    async def mock_get_user_by_email(email):
        if email == "admin@test.com":
            return {
                "email": "admin@test.com",
                "hashed_password": "hashed",
                "is_admin": True,
                "is_active": True,
                "favoritos": [],
                "plan": {"tipo_plan": "premium"},
                "creado_en": "2024-01-01T00:00:00"
            }
        elif email == "user@test.com":
            return {
                "email": "user@test.com",
                "hashed_password": "hashed",
                "is_admin": False,
                "is_active": True,
                "favoritos": [],
                "plan": {"tipo_plan": "gratuito"},
                "creado_en": "2024-01-01T00:00:00"
            }
        elif email == "inactive@test.com":
            return {
                "email": "inactive@test.com",
                "hashed_password": "hashed",
                "is_admin": True,
                "is_active": False,
                "favoritos": [],
                "plan": {"tipo_plan": "premium"},
                "creado_en": "2024-01-01T00:00:00"
            }
        return None

    import app.services.auth_service as auth_service
    monkeypatch.setattr(auth_service, "get_user_by_email", mock_get_user_by_email)


def test_admin_stats_sin_token():
    response = client.get("/api/admin/stats")
    assert response.status_code == 401


def test_admin_stats_con_token_admin(monkeypatch):
    async def mock_stats():
        return {"total_usuarios": 10, "usuarios_activos": 8, "admins": 1, "distribucion_planes": {"gratuito": 8, "premium": 2}, "nuevos_30_dias": 3}

    class MockRecetasCollection:
        async def count_documents(self, query):
            if query == {}:
                return 25
            if query.get("imagen_id") == {"$ne": None}:
                return 15
            return 0

    class MockGenCollection:
        def aggregate(self, pipeline):
            class Cursor:
                async def to_list(self, length):
                    return []
            return Cursor()

    monkeypatch.setattr("app.routers.admin_routes.obtener_stats_globales", mock_stats)
    monkeypatch.setattr("app.routers.admin_routes.recetas_collection", MockRecetasCollection())
    monkeypatch.setattr("app.routers.admin_routes.generaciones_collection", MockGenCollection())
    monkeypatch.setattr("app.routers.admin_routes.usuarios_collection", MockGenCollection())

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "usuarios" in data
    assert data["usuarios"]["total"] == 10


def test_admin_stats_con_token_no_admin():
    token = create_access_token({"sub": "user@test.com", "is_admin": False, "is_active": True})
    response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_stats_con_token_inactivo():
    token = create_access_token({"sub": "inactive@test.com", "is_admin": True, "is_active": False})
    response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_stats_sin_token():
    response = client.get("/api/admin/stats")
    assert response.status_code == 401


def test_admin_users_list_sin_token():
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_admin_users_list_con_token_no_admin():
    token = create_access_token({"sub": "user@test.com", "is_admin": False, "is_active": True})
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_users_list_con_token_admin(monkeypatch):
    async def mock_listar_usuarios_admin(skip=0, limit=50, filtro_activo=None, filtro_admin=None, sort_by=None, order=-1):
        return [
            {"email": "user1@test.com", "is_admin": False, "is_active": True, "creado_en": "2024-01-01T00:00:00"},
            {"email": "admin@test.com", "is_admin": True, "is_active": True, "creado_en": "2024-01-01T00:00:00"},
        ], 2

    monkeypatch.setattr("app.routers.admin_routes.listar_usuarios_admin", mock_listar_usuarios_admin)

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "usuarios" in data
    assert "total" in data
    assert len(data["usuarios"]) == 2
    assert data["total"] == 2


def test_admin_users_list_con_filtros(monkeypatch):
    async def mock_listar(skip=0, limit=50, filtro_activo=None, filtro_admin=None, sort_by=None, order=-1):
        assert filtro_activo is True
        assert filtro_admin is False
        return [{"email": "user1@test.com", "is_admin": False, "is_active": True, "creado_en": "2024-01-01T00:00:00"}], 1

    monkeypatch.setattr("app.routers.admin_routes.listar_usuarios_admin", mock_listar)

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.get("/api/admin/users?activo=true&admin=false", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1


def test_admin_users_patch_sin_token():
    response = client.patch("/api/admin/users/test@test.com", json={"is_active": False})
    assert response.status_code == 401


def test_admin_users_patch_con_token_no_admin():
    token = create_access_token({"sub": "user@test.com", "is_admin": False, "is_active": True})
    response = client.patch("/api/admin/users/test@test.com", json={"is_active": False}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_admin_users_patch_admin(monkeypatch):
    async def mock_toggle(email, activo):
        return True

    monkeypatch.setattr("app.routers.admin_routes.toggle_usuario_activo", mock_toggle)
    monkeypatch.setattr("app.routers.admin_routes.toggle_usuario_admin", lambda email, admin: True)

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.patch("/api/admin/users/test@test.com", json={"is_active": False}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["actualizado"]["is_active"] is True


def test_admin_users_patch_admin_plan(monkeypatch):
    async def mock_crear_plan(tipo_plan):
        return {"tipo_plan": tipo_plan.value, "generaciones_usadas": 0, "activo": True}

    monkeypatch.setattr("app.routers.admin_routes.crear_plan_usuario", mock_crear_plan)
    class MockUpdateResult:
        modified_count = 1
    async def mock_actualizar(email, plan):
        return MockUpdateResult()
    monkeypatch.setattr("app.routers.admin_routes.actualizar_plan_usuario", mock_actualizar)

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.patch("/api/admin/users/test@test.com", json={"plan": {"tipo_plan": "premium"}}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["actualizado"]["plan"] is True


def test_admin_recipes_list_sin_token():
    response = client.get("/api/admin/recipes")
    assert response.status_code == 401


def test_admin_recipes_list_admin(monkeypatch):
    class MockRecetasCollection:
        def find(self, query):
            class Cursor:
                def sort(self, *args):
                    return self
                def skip(self, *args):
                    return self
                def limit(self, *args):
                    return self
                async def to_list(self, length):
                    return [{"_id": "1", "texto_receta": "Test", "imagen_id": None, "fecha": "2024-01-01T00:00:00"}]
            return Cursor()

        async def count_documents(self, query):
            return 1

    monkeypatch.setattr("app.routers.admin_routes.recetas_collection", MockRecetasCollection())

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.get("/api/admin/recipes", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "recetas" in data
    assert "total" in data
    assert len(data["recetas"]) == 1


def test_admin_recipes_list_con_filtro_imagen(monkeypatch):
    class MockRecetasCollection:
        def find(self, query):
            class Cursor:
                def sort(self, *args):
                    return self
                def skip(self, *args):
                    return self
                def limit(self, *args):
                    return self
                async def to_list(self, length):
                    return [{"_id": "2", "texto_receta": "Con imagen", "imagen_id": "img123", "fecha": "2024-01-01T00:00:00"}]
            return Cursor()

        async def count_documents(self, query):
            return 1

    monkeypatch.setattr("app.routers.admin_routes.recetas_collection", MockRecetasCollection())

    token = create_access_token({"sub": "admin@test.com", "is_admin": True, "is_active": True})
    response = client.get("/api/admin/recipes?con_imagen=true", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1