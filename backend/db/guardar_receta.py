from db.mongo_client import recetas_collection
from datetime import datetime

def guardar_receta(receta_texto, embedding):
    receta_documento = {
        "texto_receta": receta_texto,
        "embedding": embedding,
        "fecha": datetime.now()
    }
    recetas_collection.insert_one(receta_documento)
