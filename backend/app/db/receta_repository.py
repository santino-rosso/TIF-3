from app.db.mongo_client import recetas_collection, gridfs_bucket
from datetime import datetime
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from io import BytesIO

async def guardar_receta(receta_texto, embedding, imagen_bytes, nombre_receta):
    # Guardar imagen en GridFS si existe
    imagen_id = None
    if imagen_bytes:
        # Convertir bytes a BytesIO para GridFS
        imagen_stream = BytesIO(imagen_bytes)
        imagen_id = await gridfs_bucket.upload_from_stream(
            filename=f"receta_{nombre_receta}.png",
            source=imagen_stream,
            metadata={"content_type": "image/png"}
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

async def buscar_recetas_similares(embedding_actual, top_k=4):

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