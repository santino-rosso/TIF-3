from typing import Optional
from app.db.mongo_client import usuarios_collection

async def get_user_by_email(email: str) -> Optional[dict]:
    return await usuarios_collection.find_one({"email": email})

async def create_user(email: str, hashed_password: str):
    return await usuarios_collection.insert_one({
        "email": email,
        "hashed_password": hashed_password
    })

async def update_user_password(email: str, hashed_password: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed_password}}
    )

async def delete_user_by_email(email: str):
    return await usuarios_collection.delete_one({"email": email})
