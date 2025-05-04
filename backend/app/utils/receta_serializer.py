def serializar_receta(receta):
    receta["_id"] = str(receta["_id"])
    receta["fecha"] = receta["fecha"].isoformat()
    return receta
