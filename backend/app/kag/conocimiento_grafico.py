import networkx as nx

def construir_ontologia_ingredientes():
    # Crear el grafo dirigido
    G = nx.DiGraph()

    # Ingredientes comunes que un usuario podría ingresar
    ingredientes_usuario = [
        "pan", "galletas", "fideos", "leche", "yogur", "salchicha", "helado", "queso"
    ]

    # Componentes intermedios
    componentes = [
        "harina de trigo", "gluten", "azúcar", "lactosa", "conservantes"
    ]

    # Categorías dietéticas
    categorias = [
        "celiaquía", "diabetes", "intolerancia a la lactosa"
    ]

    # Añadir nodos
    G.add_nodes_from(ingredientes_usuario + componentes + categorias)

    # Relaciones ingrediente -> componentes
    G.add_edge("pan", "harina de trigo", tipo="contiene")
    G.add_edge("galletas", "harina de trigo", tipo="contiene")
    G.add_edge("galletas", "azúcar", tipo="contiene")
    G.add_edge("fideos", "harina de trigo", tipo="contiene")
    G.add_edge("leche", "lactosa", tipo="contiene")
    G.add_edge("yogur", "lactosa", tipo="contiene")
    G.add_edge("queso", "lactosa", tipo="contiene")
    G.add_edge("salchicha", "conservantes", tipo="contiene")
    G.add_edge("helado", "azúcar", tipo="contiene")
    G.add_edge("helado", "lactosa", tipo="contiene")

    # Relaciones componentes -> categorías prohibidas
    G.add_edge("harina de trigo", "gluten", tipo="es_parte_de")
    G.add_edge("gluten", "celiaquía", tipo="prohibido_para")
    G.add_edge("azúcar", "diabetes", tipo="prohibido_para")
    G.add_edge("lactosa", "intolerancia a la lactosa", tipo="prohibido_para")

    return G



