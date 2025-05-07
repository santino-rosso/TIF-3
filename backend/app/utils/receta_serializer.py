from bson import ObjectId

def serializar_receta(receta):
    if isinstance(receta, dict):
        receta["_id"] = str(receta["_id"])
        receta["fecha"] = receta["fecha"].isoformat()
    elif hasattr(receta, "_id") and hasattr(receta, "fecha"):
        receta._id = str(receta._id)
        receta.fecha = receta.fecha.isoformat()
    elif isinstance(receta, ObjectId):
        return str(receta)  
    else:
        raise TypeError("Tipo de receta no soportado")
    return receta
