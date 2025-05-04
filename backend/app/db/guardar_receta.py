from app.db.mongo_client import recetas_collection
from datetime import datetime

async def guardar_receta(receta_texto, embedding):
    receta_documento = {
        "texto_receta": receta_texto,
        "embedding": embedding,
        "fecha": datetime.now()
    }
    
    await recetas_collection.insert_one(receta_documento)

