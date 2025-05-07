from typing import Optional
from app.db.mongo_client import usuarios_collection
from bson import ObjectId
from app.db.mongo_client import recetas_collection

async def get_user_by_email(email: str) -> Optional[dict]:
    return await usuarios_collection.find_one({"email": email})

async def create_user(email: str, hashed_password: str):
    return await usuarios_collection.insert_one({
        "email": email,
        "hashed_password": hashed_password,
        "favoritos": []
    })

async def update_user_password(email: str, hashed_password: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed_password}}
    )

async def delete_user_by_email(email: str):
    return await usuarios_collection.delete_one({"email": email})


async def agregar_favorito(email: str, receta_id: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$addToSet": {"favoritos": ObjectId(receta_id)}}
    )

async def quitar_favorito(email: str, receta_id: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$pull": {"favoritos": ObjectId(receta_id)}}
    )

async def obtener_favoritos(email: str):
    usuario = await usuarios_collection.find_one({"email": email})
    if not usuario or "favoritos" not in usuario:
        return []

    ids = usuario["favoritos"]
    recetas = await recetas_collection.find({"_id": {"$in": ids}}).to_list(length=None)
    return recetas
