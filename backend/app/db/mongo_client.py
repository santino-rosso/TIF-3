from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from app.config import settings

client = None
db = None

def init_mongo_connection():
    global client, db
    if client is None:
        client = AsyncIOMotorClient(settings.mongo_uri)
        db = client["receya_db"]

def get_db():
    if db is None:
        init_mongo_connection()
    return db

class MongoCollectionProxy:
    def __init__(self, collection_name):
        self.collection_name = collection_name

    def __getattr__(self, attr):
        return getattr(get_db()[self.collection_name], attr)

class GridFSBucketProxy:
    def __getattr__(self, attr):
        return getattr(AsyncIOMotorGridFSBucket(get_db()), attr)

# Colecciones
recetas_collection = MongoCollectionProxy("recetas")
usuarios_collection = MongoCollectionProxy("usuarios")
tokens_collection = MongoCollectionProxy("tokens")
planes_collection = MongoCollectionProxy("planes")
generaciones_collection = MongoCollectionProxy("generaciones")

# GridFS bucket para manejar archivos de imágenes
gridfs_bucket = GridFSBucketProxy()

async def create_index():
    # Crear un índice único en el campo "email" de la colección "usuarios"
    await usuarios_collection.create_index([("email", 1)], unique=True, name="unique_email_index")

async def crear_index_tokens():
    # Crea un índice TTL que borra los tokens 7 días después de su creación
    await tokens_collection.create_index("created_at", expireAfterSeconds=60 * 60 * 24 * 7)

async def close_mongo_connection():
    # Cerrar la conexión a la base de datos
    global client, db
    if client is not None:
        client.close()
        client = None
        db = None
