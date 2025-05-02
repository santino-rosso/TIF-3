import requests
from config import COLAB_API_URL

def generar_receta_desde_colab(prompt):
    payload = {"prompt": prompt}
    
    try:
        respuesta = requests.post(COLAB_API_URL+"/generar_receta", json=payload, verify=False)
        respuesta.raise_for_status()
        return respuesta.json().get("receta", "No se pudo obtener la receta.")
    except requests.exceptions.RequestException as e:
        return f"Error al conectar con Colab: {e}"

def detectar_ingredientes(prompt, imagen_base64):
    payload = {"prompt": prompt, "imagen": imagen_base64}
    
    try:
        respuesta = requests.post(COLAB_API_URL + "/detectar_ingredientes", json=payload, verify=False)
        respuesta.raise_for_status()
        return respuesta.json().get("ingredientes", "No se pudo detectar los ingredientes.")
    except requests.exceptions.RequestException as e:
        return f"Error al conectar con Colab: {e}"