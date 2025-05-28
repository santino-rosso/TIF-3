from app.kag.conocimiento_grafico import construir_ontologia_ingredientes
from app.kag.embedding_mapper import mapear_ingredientes_usuario
import networkx as nx

def validar_restricciones_ontologia(ingredientes, restricciones_usuario):
    G = construir_ontologia_ingredientes()
    ingredientes_invalidos = []
    
    # Mapear ingredientes del usuario a ingredientes conocidos en la ontología
    mapeo_ingredientes = mapear_ingredientes_usuario(ingredientes, G)

    for ingrediente in ingredientes:
        # Usar el ingrediente mapeado si existe, de lo contrario usar el original
        ingrediente_mapeado = mapeo_ingredientes.get(ingrediente)
        
        # Si no se pudo mapear, saltamos la validación para este ingrediente
        if ingrediente_mapeado is None:
            continue
            
        # Si el ingrediente mapeado no está en el grafo, saltamos
        if not G.has_node(ingrediente_mapeado):
            continue

        # Explorar nodos descendientes del ingrediente
        for nodo in nx.descendants(G, ingrediente_mapeado):
            if nodo in restricciones_usuario:
                ingredientes_invalidos.append((ingrediente, nodo))

    return ingredientes_invalidos

def validar_ingredientes_con_restricciones(ingredientes, restricciones):
    if ingredientes:
        parsed_ingredientes = [ing.strip() for ing in ingredientes.split(',') if ing.strip()]    
    else:
        parsed_ingredientes = []

    parsed_restricciones = [res.strip() for res in restricciones.split(',') if res.strip()]    
    
    # Validar con la ontología
    errores= validar_restricciones_ontologia(parsed_ingredientes, parsed_restricciones)
    
    # Solo devolvemos los ingredientes y errores
    return parsed_ingredientes, errores
