from app.models.usuario_model import UserDB, UserPublic


def test_user_db_login_model_ignora_campos_no_usados():
    user = UserDB(
        email="user@example.com",
        hashed_password="hashed",
        favoritos=[],
        plan={"tipo_plan": "gratuito"},
    )

    assert user.email == "user@example.com"
    assert user.hashed_password == "hashed"
    assert not hasattr(user, "favoritos")
    assert not hasattr(user, "plan")


def test_user_public_expone_solo_email():
    user = UserPublic(email="user@example.com")

    assert user.model_dump() == {"email": "user@example.com"}
