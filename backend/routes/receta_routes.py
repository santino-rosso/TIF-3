from flask import Blueprint, request, jsonify
from services.colab_service import generar_receta_desde_colab
from utils.armar_prompt import armar_prompt  

receta_bp = Blueprint('receta', __name__)

@receta_bp.route("/generar-receta", methods=["POST"])
def generar_receta():
    datos_usuario = request.json

    prompt = armar_prompt(datos_usuario)

    receta_generada = generar_receta_desde_colab(prompt)

    return jsonify({
        "receta_generada": receta_generada
    })
