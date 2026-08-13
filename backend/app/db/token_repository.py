from datetime import datetime
from app.db.mongo_client import tokens_collection


# Guarda el refresh token asociado al usuario
async def guardar_refresh_token(email: str, refresh_token: str, created_at: datetime) -> None:
    await tokens_collection.insert_one({
        "email": email,
        "refresh_token": refresh_token,
        "created_at": created_at
    })

# Elimina un refresh token específico
async def eliminar_refresh_token_de_usuario(email: str, refresh_token: str):
    result = await tokens_collection.delete_one({
        "email": email,
        "refresh_token": refresh_token
    })
    return result.deleted_count > 0

# Elimina todos los refresh tokens de un usuario
async def eliminar_refresh_tokens_por_email(email: str):
    result = await tokens_collection.delete_many({"email": email})
    return result.deleted_count

# Validar si el refresh token existe
async def obtener_refresh_token(refresh_token: str):
    token = await tokens_collection.find_one({"refresh_token": refresh_token})
    return token
