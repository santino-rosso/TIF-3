from fastapi.testclient import TestClient

from app.main import app
from app.routers import user_routes


def test_login_rate_limit_devuelve_429(monkeypatch):
    async def fake_get_user_by_email(email):
        return None

    monkeypatch.setattr(user_routes, "get_user_by_email", fake_get_user_by_email)

    client = TestClient(app)

    assert app.state.limiter.enabled is False

    app.state.limiter.enabled = True
    try:
        for _ in range(5):
            response = client.post("/api/login", data={"username": "nadie@test.com", "password": "incorrecta"})
            assert response.status_code == 401

        response = client.post("/api/login", data={"username": "nadie@test.com", "password": "incorrecta"})
        assert response.status_code == 429
    finally:
        app.state.limiter.enabled = False
