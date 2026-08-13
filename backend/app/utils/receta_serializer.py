from bson import ObjectId

def serializar_receta(receta):
    if isinstance(receta, dict):
        receta_serializada = receta.copy()

        if "_id" in receta_serializada and receta_serializada["_id"] is not None:
            receta_serializada["_id"] = str(receta_serializada["_id"])
        if "imagen_id" in receta_serializada and isinstance(receta_serializada["imagen_id"], ObjectId):
            receta_serializada["imagen_id"] = str(receta_serializada["imagen_id"])
        if "fecha" in receta_serializada and hasattr(receta_serializada["fecha"], "isoformat"):
            receta_serializada["fecha"] = receta_serializada["fecha"].isoformat()

        return receta_serializada
    elif hasattr(receta, "_id") and hasattr(receta, "fecha"):
        receta._id = str(receta._id)
        receta.fecha = receta.fecha.isoformat()
    elif isinstance(receta, ObjectId):
        return str(receta)  
    else:
        raise TypeError("Tipo de receta no soportado")
    return receta
