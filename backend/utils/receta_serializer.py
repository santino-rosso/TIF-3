def serializar_receta(receta):
    receta["_id"] = str(receta["_id"])
    return receta
