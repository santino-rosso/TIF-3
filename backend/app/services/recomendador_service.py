from app.db.user_repository import obtener_favoritos
from app.db.receta_repository import obtener_todas_con_embedding
from app.utils.vector_similarity import rank_recipes_by_cosine_similarity
import numpy as np


async def obtener_recomendaciones_por_favoritos(email, top_k=10):
    # Obtener recetas favoritas del usuario
    favoritos = await obtener_favoritos(email)
    if not favoritos:
        # Si no hay favoritos, devolver recetas aleatorias
        # Usamos una función auxiliar para no acoplarnos a la DB
        from app.db.mongo_client import recetas_collection
        recetas = await recetas_collection.aggregate([{"$sample": {"size": top_k}}]).to_list(length=top_k)
        return recetas

    # Obtener embeddings de favoritos
    embeddings_favoritos = [r["embedding"] for r in favoritos if "embedding" in r]
    if not embeddings_favoritos:
        from app.db.mongo_client import recetas_collection
        recetas = await recetas_collection.aggregate([{"$sample": {"size": top_k}}]).to_list(length=top_k)
        return recetas

    # Calcular embedding promedio del usuario
    embedding_usuario = np.mean(np.array(embeddings_favoritos), axis=0)

    # Buscar todas las recetas con embedding (usa el repository)
    recetas = await obtener_todas_con_embedding()
    if not recetas:
        return []

    # Ordenar recetas por similitud (excluyendo las ya favoritas)
    ids_favoritos = set(str(r["_id"]) for r in favoritos)
    return rank_recipes_by_cosine_similarity(
        embedding_usuario,
        recetas,
        excluded_ids=ids_favoritos,
        top_k=top_k,
    )