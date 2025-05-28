from app.services.embedding_service import modelo_embedding
from sentence_transformers import util
import torch
import re

def obtener_nodos_ingredientes(grafo):
    # Definir las categorías de ingredientes que no deben ser considerados
    categorias = ["celiaquía", "diabetes", "intolerancia a la lactosa"]
    
    # Filtrar nodos que son ingredientes y no están conectados a las categorías
    ingredientes = [
        nodo for nodo in grafo.nodes()
        if nodo not in categorias and not any(grafo.has_edge(nodo, cat) for cat in categorias)
    ]
    
    return ingredientes

def buscar_coincidencia_por_palabras(ingrediente, ingredientes_base):
    palabras = re.findall(r'\b\w+\b', ingrediente.lower())
    
    for palabra in palabras:
        if len(palabra) > 2:  # Ignorar palabras muy cortas
            # Buscar coincidencia exacta
            for ing_base in ingredientes_base:
                ing_base_lower = ing_base.lower()
                
                # Coincidencia exacta
                if palabra == ing_base_lower:
                    return ing_base
                
                # Coincidencia plural/singular
                if palabra.endswith('s') and palabra[:-1] == ing_base_lower:
                    return ing_base
                if ing_base_lower.endswith('s') and ing_base_lower[:-1] == palabra:
                    return ing_base
    
    return None

def es_variante_de(ingrediente_usuario, ingrediente_base):
    # Convertir ambos a minúsculas para comparación
    ing_usuario = ingrediente_usuario.lower().strip()
    ing_base = ingrediente_base.lower().strip()

    #Ignorar ingredientes vacíos
    if not ing_usuario or not ing_base:
        return False

    # El ingrediente base está contenido completamente en el ingrediente del usuario
    if ing_base in ing_usuario and len(ing_base) > 2:
        return True
    
    # El ingrediente del usuario comienza con el ingrediente base
    if ing_usuario.startswith(ing_base + " "):
        return True
    
    # El ingrediente base es una palabra completa dentro del ingrediente usuario
    palabras_usuario = re.findall(r'\b\w+\b', ing_usuario)
    if ing_base in palabras_usuario:
        return True
    
    return False
    
   
def mapear_ingredientes_usuario(ingredientes_usuario, grafo, umbral_exacto=0.50, umbral_general=0.80):
    # Si no hay ingredientes, devolver diccionario vacío
    if not ingredientes_usuario:
        return {}
    
    # Obtener ingredientes base
    ingredientes_base = obtener_nodos_ingredientes(grafo)

    #Crear mapeo
    mapeo = {}
    for ingrediente in ingredientes_usuario:
        # Si el ingrediente es vacío, lo ignoramos
        if not ingrediente.strip():
            continue

        # PASO 1: Buscar coincidencias exactas palabra por palabra
        coincidencia_palabra = buscar_coincidencia_por_palabras(ingrediente, ingredientes_base)
        if coincidencia_palabra:
            mapeo[ingrediente] = coincidencia_palabra
            print(f"Ingrediente: '{ingrediente}' → Coincidencia exacta por palabra: '{coincidencia_palabra}'")
            continue

        # PASO 2: Buscar variantes (contenido/prefijo) y usar umbral más bajo
        candidatos_variantes = [
            base for base in ingredientes_base if es_variante_de(ingrediente, base)
        ]

        if candidatos_variantes:
            # Si encontramos coincidencias textuales, calculamos embeddings específicos
            textos_para_comparar = [ingrediente] + candidatos_variantes
            embeddings = modelo_embedding.encode(textos_para_comparar, convert_to_tensor=True)

            # Comparamos el embedding del ingrediente usuario con cada coincidencia
            similitudes = util.cos_sim(embeddings[0:1], embeddings[1:])

            # Encontrar la mejor coincidencia
            idx_max = similitudes[0].argmax().item()
            mejor_match = candidatos_variantes[idx_max]
            similitud = similitudes[0][idx_max].item()

            print(f"Ingrediente: '{ingrediente}' → Variante detectada: '{mejor_match}' (similitud: {similitud:.4f})")
            
            # Si supera el umbral, lo mapeamos
            if similitud >= umbral_exacto:
                mapeo[ingrediente] = mejor_match
                continue
        
        # PASO 3: Fallback con umbral alto para evitar falsos positivos
        # Codificamos solo este ingrediente y todos los ingredientes base
        emb_usuario = modelo_embedding.encode([ingrediente], convert_to_tensor=True)
        emb_base = modelo_embedding.encode(ingredientes_base, convert_to_tensor=True)
        
        # Calculamos similitud
        similitudes = util.cos_sim(emb_usuario, emb_base)

        # Encontrar la mejor coincidencia
        idx_max = similitudes[0].argmax().item()
        mejor_match = ingredientes_base[idx_max]
        similitud = similitudes[0][idx_max].item()
        
        print(f"Ingrediente: '{ingrediente}' → Mejor match general: '{mejor_match}' (similitud: {similitud:.4f})")
        
        # Si supera el umbral, lo mapeamos
        if similitud >= umbral_general:
            mapeo[ingrediente] = mejor_match
        else:
            mapeo[ingrediente] = None
            print(f"  ↳ No se pudo mapear '{ingrediente}' (similitud muy baja)")

    return mapeo
