import requests
from config import COLAB_API_URL

def generar_receta_desde_colab(prompt, imagen_base64=None):
    payload = {"prompt": prompt}

    if imagen_base64:
        payload["imagen"] = imagen_base64
    
    try:
        respuesta = requests.post(COLAB_API_URL+"/generar_receta", json=payload, verify=False)
        respuesta.raise_for_status()
        return respuesta.json().get("receta", "No se pudo obtener la receta.")
    except requests.exceptions.RequestException as e:
        return f"Error al conectar con Colab: {e}"
