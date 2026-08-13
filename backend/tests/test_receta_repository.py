from app.db.receta_repository import obtener_metadata_imagen


def test_obtener_metadata_imagen_detecta_jpg_png_webp_y_fallback():
    assert obtener_metadata_imagen(b"\xff\xd8\xffrest") == ("jpg", "image/jpeg")
    assert obtener_metadata_imagen(b"\x89PNG\r\n\x1a\nrest") == ("png", "image/png")
    assert obtener_metadata_imagen(b"RIFF1234WEBPrest") == ("webp", "image/webp")
    assert obtener_metadata_imagen(b"not-an-image") == (
        "bin",
        "application/octet-stream",
    )
