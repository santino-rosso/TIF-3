from db.mongo_client import recetas_collection
from datetime import datetime

def guardar_receta(data, receta_texto):
    receta_documento = {
        "ingredientes": data.get("ingredientes", []),
        "preferencias": data.get("preferencias", ""),
        "restricciones": data.get("restricciones", ""),
        "tiempo": data.get("tiempo", ""),
        "tipo_comida": data.get("tipo_comida", ""),
        "herramientas": data.get("herramientas", ""),
        "experiencia": data.get("experiencia", ""),
        "texto_receta": receta_texto,
        "fecha": datetime.now()
    }
    recetas_collection.insert_one(receta_documento)
