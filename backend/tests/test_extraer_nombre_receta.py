from app.utils.extraer_nombre_receta import extraer_nombre


def test_extraer_nombre_remueve_etiqueta_con_mayusculas_y_markdown():
    receta = """**Nombre de la receta:** Arroz con Pollo

Ingredientes:
- Arroz
- Pollo
"""

    assert extraer_nombre(receta) == "Arroz con Pollo"


def test_extraer_nombre_mantiene_fallback_de_primera_linea():
    receta = """Tortilla de Papas

- Papa
- Huevo
"""

    assert extraer_nombre(receta) == "Tortilla de Papas"
