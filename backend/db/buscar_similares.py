from db.mongo_client import recetas_collection
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def buscar_recetas_similares(embedding_actual, top_k=3):

    simulitudMaxima = 0.98  # umbral para evitar recetas "casi iguales"

    recetas = list(recetas_collection.find({"embedding": {"$exists": True}}))

    if not recetas:
        return []

    embeddings_existentes = np.array([r["embedding"] for r in recetas])
    similitudes = cosine_similarity([embedding_actual], embeddings_existentes)[0]

    # Verificar si hay recetas duplicadas
    # Si la similitud máxima es mayor que el umbral, se considera duplicada. Por lo tanto, no se guarda.
    if (np.any(similitudes > simulitudMaxima)):
        recetaDuplciada = True
        print("Receta duplicada, no se guardará en la base de datos.")
    else:
        recetaDuplciada = False

    recetas_con_similitud = [
        {"receta": receta, "similitud": sim}
        for receta, sim in zip(recetas, similitudes)
    ]

    recetas_ordenadas = sorted(recetas_con_similitud, key=lambda x: x["similitud"], reverse=True)

    return [r["receta"] for r in recetas_ordenadas[:top_k]], recetaDuplciada