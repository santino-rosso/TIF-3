import sys
import types

import pytest
import torch

_stub = types.ModuleType("app.services.embedding_service")


class _StubModel:
    def encode(self, *args, **kwargs):
        raise AssertionError("embedding model should not be loaded in tests")


_stub.modelo_embedding = _StubModel()
_previous_embedding_service = sys.modules.get("app.services.embedding_service")
sys.modules["app.services.embedding_service"] = _stub
from app.kag.embedding_mapper import (
    buscar_coincidencia_por_palabras,
    es_variante_de,
    _mejor_coincidencia_coseno,
)
if _previous_embedding_service is not None:
    sys.modules["app.services.embedding_service"] = _previous_embedding_service
else:
    sys.modules.pop("app.services.embedding_service", None)


def test_buscar_coincidencia_por_palabras_coincidencia_exacta():
    assert buscar_coincidencia_por_palabras("tomate", ["tomate", "cebolla"]) == "tomate"


def test_buscar_coincidencia_por_palabras_plural_a_singular():
    assert buscar_coincidencia_por_palabras("tomates", ["tomate", "cebolla"]) == "tomate"


def test_buscar_coincidencia_por_palabras_singular_a_plural():
    assert buscar_coincidencia_por_palabras("tomate", ["tomates", "cebolla"]) == "tomates"


def test_buscar_coincidencia_por_palabras_ignora_palabras_cortas():
    assert buscar_coincidencia_por_palabras("te", ["te"]) is None


def test_es_variante_de_contenido():
    assert es_variante_de("salsa de tomate", "tomate") is True


def test_es_variante_de_prefijo_con_espacio():
    assert es_variante_de("tomate cherry", "tomate") is True


def test_es_variante_de_palabra_completa():
    assert es_variante_de("pure de tomate fresco", "tomate") is True


def test_es_variante_de_cadenas_vacias_devuelve_false():
    assert es_variante_de("", "tomate") is False
    assert es_variante_de("tomate", "") is False
    assert es_variante_de("", "") is False


def test_es_variante_de_base_corto_como_subcadena_devuelve_false():
    assert es_variante_de("tomate", "te") is False


def test_mejor_coincidencia_coseno_devuelve_candidato_mas_similar():
    query = torch.tensor([[1.0, 0.0]])
    candidatos = torch.tensor([[1.0, 0.0], [0.0, 1.0]])

    nombre, similitud = _mejor_coincidencia_coseno(query, candidatos, ["a", "b"])

    assert nombre == "a"
    assert similitud == pytest.approx(1.0)


def test_mejor_coincidencia_coseno_devuelve_candidato_no_primero():
    query = torch.tensor([[0.0, 1.0]])
    candidatos = torch.tensor([[1.0, 0.0], [0.0, 1.0]])

    nombre, similitud = _mejor_coincidencia_coseno(query, candidatos, ["a", "b"])

    assert nombre == "b"
    assert similitud == pytest.approx(1.0)
