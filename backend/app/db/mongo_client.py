from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Configuración de la conexión a MongoDB
client = AsyncIOMotorClient(settings.mongo_uri)
db = client["receya_db"]
recetas_collection = db["recetas"]
