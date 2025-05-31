from app.db.user_repository import obtener_favoritos
from app.db.receta_repository import recetas_collection
from app.services.embedding_service import modelo_embedding
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

async def obtener_recomendaciones_por_favoritos(email, top_k=10):
    # Obtener recetas favoritas del usuario
    favoritos = await obtener_favoritos(email)
    if not favoritos:
        # Si no hay favoritos, devolver recetas aleatorias
        recetas = await recetas_collection.aggregate([{"$sample": {"size": top_k}}]).to_list(length=top_k)
        return recetas

    # Obtener embeddings de favoritos
    embeddings_favoritos = [r["embedding"] for r in favoritos if "embedding" in r]
    if not embeddings_favoritos:
        recetas = await recetas_collection.aggregate([{"$sample": {"size": top_k}}]).to_list(length=top_k)
        return recetas

    # Calcular embedding promedio del usuario
    embedding_usuario = np.mean(np.array(embeddings_favoritos), axis=0)

    # Buscar todas las recetas con embedding
    recetas_cursor = recetas_collection.find({"embedding": {"$exists": True}})
    recetas = await recetas_cursor.to_list(length=None)
    if not recetas:
        return []

    embeddings_existentes = np.array([r["embedding"] for r in recetas])
    similitudes = cosine_similarity([embedding_usuario], embeddings_existentes)[0]

    # Ordenar recetas por similitud (excluyendo las ya favoritas)
    ids_favoritos = set(str(r["_id"]) for r in favoritos)
    recetas_con_similitud = [
        {"receta": receta, "similitud": sim}
        for receta, sim in zip(recetas, similitudes)
        if str(receta["_id"]) not in ids_favoritos
    ]
    recetas_ordenadas = sorted(recetas_con_similitud, key=lambda x: x["similitud"], reverse=True)
    return [r["receta"] for r in recetas_ordenadas[:top_k]]
