from app.models.usuario_model import UserDB, UserPublic
from datetime import datetime


def test_user_db_login_model_ignora_campos_no_usados():
    user = UserDB(
        email="user@example.com",
        hashed_password="hashed",
        favoritos=[],
        plan={"tipo_plan": "gratuito"},
        is_admin=False,
        is_active=True,
        creado_en=datetime.now()
    )

    assert user.email == "user@example.com"
    assert user.hashed_password == "hashed"
    assert user.is_admin is False
    assert user.is_active is True
    assert user.favoritos == []
    assert user.plan == {"tipo_plan": "gratuito"}


def test_user_public_expone_solo_email():
    user = UserPublic(email="user@example.com", is_admin=False, is_active=True)

    dump = user.model_dump()
    assert dump["email"] == "user@example.com"
    assert dump["is_admin"] is False
    assert dump["is_active"] is True
    # creado_en puede estar ausente si es None