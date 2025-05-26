import google.generativeai as genai
from PIL import Image
from io import BytesIO
from app.config import settings


api_key = settings.gemini_api_key
if not api_key:
    raise ValueError("La variable de entorno GEMINI_API_KEY no está configurada.")

# Configurar la API Key
genai.configure(api_key=api_key)

# Cargar el modelo Gemini
modelo_gemini = genai.GenerativeModel("gemini-2.0-flash-lite")
 

async def generar_receta_gemini(prompt):
    try:
        respuesta = modelo_gemini.generate_content([prompt])

        return respuesta.text

    except Exception as e:
        return f"Error al generar receta: {str(e)}"

async def detectar_ingredientes_gemini(prompt=None, imagen_file=None):
    try:
        contenido = await imagen_file.read()
        image = Image.open(BytesIO(contenido)).convert("RGB")

        respuesta = modelo_gemini.generate_content([prompt, image])

        return respuesta.text

    except Exception as e:
        return f"Error al identificar ingredientes: {str(e)}"
        
        
async def validar_y_adaptar_receta_con_gemini(prompt):
    try:
        respuesta = modelo_gemini.generate_content([prompt])
        
        return respuesta.text

    except Exception as e:
        return f"Error al validar y adaptar receta: {str(e)}"
