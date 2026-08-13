from datetime import datetime, timezone

from bson import ObjectId

from app.utils.receta_serializer import serializar_receta


def test_serializar_receta_convierte_ids_y_fecha_sin_mutar_original():
    receta_id = ObjectId()
    imagen_id = ObjectId()
    fecha = datetime(2026, 8, 13, 10, 30, tzinfo=timezone.utc)
    receta = {
        "_id": receta_id,
        "imagen_id": imagen_id,
        "fecha": fecha,
        "texto_receta": "Tortilla",
    }

    result = serializar_receta(receta)

    assert result == {
        "_id": str(receta_id),
        "imagen_id": str(imagen_id),
        "fecha": fecha.isoformat(),
        "texto_receta": "Tortilla",
    }
    assert receta["_id"] == receta_id
    assert receta["imagen_id"] == imagen_id
    assert receta["fecha"] == fecha


def test_serializar_receta_tolera_campos_opcionales_faltantes_o_nulos():
    receta = {"_id": None, "texto_receta": "Sopa"}

    result = serializar_receta(receta)

    assert result == {"_id": None, "texto_receta": "Sopa"}
