from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Configuración de la conexión a MongoDB
client = AsyncIOMotorClient(settings.mongo_uri)
db = client["receya_db"]
recetas_collection = db["recetas"]
usuarios_collection = db["usuarios"]

async def create_index():
    # Crear un índice único en el campo "email" de la colección "usuarios"
    await usuarios_collection.create_index([("email", 1)], unique=True, name="unique_email_index")

async def close_mongo_connection():
    # Cerrar la conexión a la base de datos
    client.close()