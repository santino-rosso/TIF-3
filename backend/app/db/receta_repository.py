from app.db.mongo_client import recetas_collection, gridfs_bucket
from app.utils.vector_similarity import find_duplicate_recipe, rank_recipes_by_cosine_similarity
from datetime import datetime
from io import BytesIO


def obtener_metadata_imagen(imagen_bytes):
    if imagen_bytes.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if imagen_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if imagen_bytes.startswith(b"RIFF") and imagen_bytes[8:12] == b"WEBP":
        return "webp", "image/webp"
    return "bin", "application/octet-stream"


async def guardar_receta(receta_texto, embedding, imagen_bytes, nombre_receta):
    # Guardar imagen en GridFS si existe
    imagen_id = None
    if imagen_bytes:
        extension, content_type = obtener_metadata_imagen(imagen_bytes)
        # Convertir bytes a BytesIO para GridFS
        imagen_stream = BytesIO(imagen_bytes)
        imagen_id = await gridfs_bucket.upload_from_stream(
            filename=f"receta_{nombre_receta}.{extension}",
            source=imagen_stream,
            metadata={"content_type": content_type}
        )
    
    receta_documento = {
        "texto_receta": receta_texto,
        "embedding": embedding,
        "imagen_id": str(imagen_id) if imagen_id else None,
        "fecha": datetime.now()
    }
    resultado = await recetas_collection.insert_one(receta_documento)
    
    # Devolver tanto el ID de la receta como el ID de la imagen
    return str(resultado.inserted_id), str(imagen_id) if imagen_id else None


async def obtener_todas_con_embedding():
    """Retorna todas las recetas que tienen embedding (para recomendaciones)."""
    cursor = recetas_collection.find({"embedding": {"$exists": True}})
    return await cursor.to_list(length=None)


async def buscar_recetas_similares(embedding_actual, top_k=4):

    similitud_maxima = 0.98  # umbral para evitar recetas "casi iguales"

    # Obtener recetas con embeddings existentes
    recetas_cursor = recetas_collection.find({"embedding": {"$exists": True}})
    recetas = await recetas_cursor.to_list(length=None)

    if not recetas:
        return [], None

    receta_duplicada = find_duplicate_recipe(
        embedding_actual,
        recetas,
        threshold=similitud_maxima,
    )
    recetas_ordenadas = rank_recipes_by_cosine_similarity(
        embedding_actual,
        recetas,
        top_k=top_k,
    )

    return recetas_ordenadas, receta_duplicada