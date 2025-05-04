from flask import Blueprint, request, jsonify
from services.gemini_service import generar_receta_gemini, detectar_ingredientes_gemini
from services.embedding_service import generar_embedding
from db.guardar_receta import guardar_receta
from db.buscar_similares import buscar_recetas_similares
from utils.receta_serializer import serializar_receta
from utils.armar_prompt import formato_prompt_detectar_ingredientes, formato_prompt_generar_receta

receta_bp = Blueprint('receta', __name__)

@receta_bp.route("/generar-receta", methods=["POST"])
def generar_receta():
    datos_usuario = request.form.to_dict()
    imagen_file = request.files['imagen']

    if imagen_file:
        prompt = formato_prompt_detectar_ingredientes()
        ingredientes_detectados = detectar_ingredientes_gemini(prompt, imagen_file)
        datos_usuario["ingredientes"] = ingredientes_detectados
        prompt = formato_prompt_generar_receta(datos_usuario)
        receta_generada = generar_receta_gemini(prompt)
        print(ingredientes_detectados)
    else:  
        prompt = formato_prompt_generar_receta(datos_usuario)
        receta_generada = generar_receta_gemini(prompt)

    embedding = generar_embedding(receta_generada)

    recetas_similares, recetaDuplicada = buscar_recetas_similares(embedding)

    if not recetaDuplicada:
        print("Receta no duplicada, guardando en la base de datos.")
        guardar_receta(receta_generada, embedding)

    recetas_similares_serializados = [serializar_receta(r_s) for r_s in recetas_similares]

    return jsonify({
        "receta_generada": receta_generada,
        "recetas_similares": recetas_similares_serializados  
    })
