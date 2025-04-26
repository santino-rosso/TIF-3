from flask import Blueprint, request, jsonify
from services.colab_service import generar_receta_desde_colab
from utils.armar_prompt import armar_prompt  
from utils.embedding_generator import generar_embedding
from db.guardar_receta import guardar_receta
from db.buscar_similares import buscar_recetas_similares
from utils.receta_serializer import serializar_receta

receta_bp = Blueprint('receta', __name__)

@receta_bp.route("/generar-receta", methods=["POST"])
def generar_receta():
    datos_usuario = request.json

    prompt, imagen_base64 = armar_prompt(datos_usuario)

    if imagen_base64:
        receta_generada = generar_receta_desde_colab(prompt, imagen_base64)
    else:  
        receta_generada = generar_receta_desde_colab(prompt)

    embedding = generar_embedding(receta_generada)

    recetas_similares, recetaDuplicada = buscar_recetas_similares(embedding)

    if not recetaDuplicada:
        print("Receta no duplicada, guardando en la base de datos.")
        guardar_receta(datos_usuario, receta_generada, embedding)

    recetas_similares_serializados = [serializar_receta(r_s) for r_s in recetas_similares]

    return jsonify({
        "receta_generada": receta_generada,
        "recetas_similares": recetas_similares_serializados  
    })
