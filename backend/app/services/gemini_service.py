import google.generativeai as genai
from PIL import Image
import os
from dotenv import load_dotenv
from io import BytesIO

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("La variable de entorno GEMINI_API_KEY no está configurada.")

# Configurar la API Key
genai.configure(api_key=api_key)

# Cargar el modelo Gemini
modelo_gemini = genai.GenerativeModel("gemini-2.0-flash-lite")
 

async def generar_receta_gemini(prompt):
    try:
        if not prompt:
            return "Error: Debes enviar un prompt"

        respuesta = modelo_gemini.generate_content([prompt])

        return respuesta.text

    except Exception as e:
        return f"Error al generar receta: {str(e)}"

async def detectar_ingredientes_gemini(prompt=None, imagen_file=None):
    try:
        if not prompt or not imagen_file:
            return "Error: Debes enviar texto (prompt) e imagen"

        
        contenido = await imagen_file.read()
        image = Image.open(BytesIO(contenido)).convert("RGB")

        respuesta = modelo_gemini.generate_content([prompt, image])

        return respuesta.text

    except Exception as e:
        return f"Error al identificar ingredientes: {str(e)}"
