import asyncio

from app.db import receta_repository
from app.db.receta_repository import obtener_metadata_imagen


def test_obtener_metadata_imagen_detecta_jpg_png_webp_y_fallback():
    assert obtener_metadata_imagen(b"\xff\xd8\xffrest") == ("jpg", "image/jpeg")
    assert obtener_metadata_imagen(b"\x89PNG\r\n\x1a\nrest") == ("png", "image/png")
    assert obtener_metadata_imagen(b"RIFF1234WEBPrest") == ("webp", "image/webp")
    assert obtener_metadata_imagen(b"not-an-image") == (
        "bin",
        "application/octet-stream",
    )


class FakeCursor:
    def __init__(self, documents):
        self.documents = documents

    async def to_list(self, length=None):
        return self.documents


class FakeRecetasCollection:
    def __init__(self, documents):
        self.documents = documents
        self.query = None

    def find(self, query):
        self.query = query
        return FakeCursor(self.documents)


def test_buscar_recetas_similares_detecta_duplicado_y_ordena(monkeypatch):
    duplicated = {"_id": "same", "embedding": [1.0, 0.0]}
    other = {"_id": "other", "embedding": [0.0, 1.0]}
    collection = FakeRecetasCollection([other, duplicated])
    monkeypatch.setattr(receta_repository, "recetas_collection", collection)

    similares, duplicada = asyncio.run(
        receta_repository.buscar_recetas_similares([1.0, 0.0], top_k=1)
    )

    assert collection.query == {"embedding": {"$exists": True}}
    assert similares == [duplicated]
    assert duplicada == duplicated
