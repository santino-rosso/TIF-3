from app.db.mongo_client import recetas_collection
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

async def guardar_receta(receta_texto, embedding):
    receta_documento = {
        "texto_receta": receta_texto,
        "embedding": embedding,
        "fecha": datetime.now()
    }
    resultado = await recetas_collection.insert_one(receta_documento)
    return str(resultado.inserted_id)

async def buscar_recetas_similares(embedding_actual, top_k=3):

    simulitud_maxima = 0.98  # umbral para evitar recetas "casi iguales"

    # Obtener recetas con embeddings existentes
    recetas_cursor = recetas_collection.find({"embedding": {"$exists": True}})
    recetas = await recetas_cursor.to_list(length=None)

    if not recetas:
        return [], None

    embeddings_existentes = np.array([r["embedding"] for r in recetas])
    similitudes = cosine_similarity([embedding_actual], embeddings_existentes)[0]

    # Verificar si hay recetas duplicadas
    # Si la similitud máxima es mayor que el umbral, se considera duplicada. Por lo tanto, no se guarda.
    if (np.any(similitudes > simulitud_maxima)):
        indice_mayor_similitud = np.argmax(similitudes)
        if similitudes[indice_mayor_similitud] > simulitud_maxima:
            receta_duplicada = recetas[indice_mayor_similitud]
    else:
        receta_duplicada = None

    recetas_con_similitud = [
        {"receta": receta, "similitud": sim}
        for receta, sim in zip(recetas, similitudes)
    ]

    recetas_ordenadas = sorted(recetas_con_similitud, key=lambda x: x["similitud"], reverse=True)

    return [r["receta"] for r in recetas_ordenadas[:top_k]], receta_duplicada