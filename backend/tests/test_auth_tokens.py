import asyncio

import pytest
from fastapi import HTTPException

from app.db import token_repository
from app.routers import user_routes
from app.services import auth_service


class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class FakeTokensCollection:
    def __init__(self):
        self.filters = []

    async def delete_many(self, filter_):
        self.filters.append(filter_)
        return DeleteResult(deleted_count=3)


def test_delete_user_revoca_tokens_antes_de_borrar_usuario(monkeypatch):
    calls = []

    async def fake_eliminar_refresh_tokens_por_email(email):
        calls.append(("tokens", email))
        return 2

    async def fake_delete_user_by_email(email):
        calls.append(("user", email))
        return DeleteResult(deleted_count=1)

    monkeypatch.setattr(
        user_routes,
        "eliminar_refresh_tokens_por_email",
        fake_eliminar_refresh_tokens_por_email,
    )
    monkeypatch.setattr(user_routes, "delete_user_by_email", fake_delete_user_by_email)

    response = asyncio.run(user_routes.delete_user(current_user={"email": "user@example.com"}))

    assert response == {"msg": "Usuario eliminado correctamente."}
    assert calls == [("tokens", "user@example.com"), ("user", "user@example.com")]


def test_refresh_rechaza_token_existente_si_usuario_no_existe(monkeypatch):
    refresh_token, _ = auth_service.create_refresh_token({"sub": "user@example.com"})

    async def fake_obtener_refresh_token(token):
        assert token == refresh_token
        return {"email": "user@example.com", "refresh_token": refresh_token}

    async def fake_get_user_by_email(email):
        assert email == "user@example.com"
        return None

    monkeypatch.setattr(auth_service, "obtener_refresh_token", fake_obtener_refresh_token)
    monkeypatch.setattr(auth_service, "get_user_by_email", fake_get_user_by_email)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(auth_service.refresh_access_token(refresh_token))

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Refresh token inválido."


def test_refresh_rechaza_token_si_email_guardado_no_coincide_con_sub(monkeypatch):
    refresh_token, _ = auth_service.create_refresh_token({"sub": "user@example.com"})

    async def fake_obtener_refresh_token(token):
        assert token == refresh_token
        return {"email": "other@example.com", "refresh_token": refresh_token}

    async def fail_get_user_by_email(email):
        raise AssertionError("user lookup should not run when token email mismatches")

    monkeypatch.setattr(auth_service, "obtener_refresh_token", fake_obtener_refresh_token)
    monkeypatch.setattr(auth_service, "get_user_by_email", fail_get_user_by_email)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(auth_service.refresh_access_token(refresh_token))

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Refresh token inválido."


def test_eliminar_refresh_tokens_por_email_usa_filtro_de_email(monkeypatch):
    fake_collection = FakeTokensCollection()
    monkeypatch.setattr(token_repository, "tokens_collection", fake_collection)

    deleted_count = asyncio.run(
        token_repository.eliminar_refresh_tokens_por_email("user@example.com")
    )

    assert deleted_count == 3
    assert fake_collection.filters == [{"email": "user@example.com"}]
