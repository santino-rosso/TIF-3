from bson import ObjectId


def serializar_receta(receta):
    if not isinstance(receta, dict):
        raise TypeError("Tipo de receta no soportado")

    receta_serializada = receta.copy()

    if "_id" in receta_serializada and receta_serializada["_id"] is not None:
        receta_serializada["_id"] = str(receta_serializada["_id"])
    if "imagen_id" in receta_serializada and isinstance(receta_serializada["imagen_id"], ObjectId):
        receta_serializada["imagen_id"] = str(receta_serializada["imagen_id"])
    if "fecha" in receta_serializada and hasattr(receta_serializada["fecha"], "isoformat"):
        receta_serializada["fecha"] = receta_serializada["fecha"].isoformat()

    return receta_serializada
