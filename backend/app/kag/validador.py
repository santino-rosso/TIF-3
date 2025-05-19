from app.kag.conocimiento_grafico import construir_ontologia_ingredientes
import networkx as nx

def validar_restricciones_ontologia(ingredientes, restricciones_usuario):
    G = construir_ontologia_ingredientes()
    ingredientes_invalidos = []

    for ingrediente in ingredientes:
        if not G.has_node(ingrediente):
            continue  # Ignorar si no está en la ontología

        # Explorar nodos descendientes del ingrediente
        for nodo in nx.descendants(G, ingrediente):
            if nodo in restricciones_usuario:
                ingredientes_invalidos.append((ingrediente, nodo))

    return ingredientes_invalidos

def validar_ingredientes_con_restricciones(ingredientes, restricciones):
    if ingredientes:
        parsed_ingredientes = [ing.strip() for ing in ingredientes.split(',') if ing.strip()]    
    else:
        parsed_ingredientes = []

    parsed_restricciones = [res.strip() for res in restricciones.split(',') if res.strip()]    
    errores = validar_restricciones_ontologia(parsed_ingredientes, parsed_restricciones)
    return parsed_ingredientes, errores
