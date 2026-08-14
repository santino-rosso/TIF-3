import base64
import json
import urllib.error
import urllib.request

from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO
from app.config import settings

api_key = settings.gemini_api_key
if not api_key:
    raise ValueError("La variable de entorno GEMINI_API_KEY no está configurada.")

# Configurar el cliente Gemini
client = genai.Client(api_key=api_key)

modelo_texto = settings.gemini_text_model
modelo_imagen = settings.gemini_image_model


class GeminiGenerationError(Exception):
    pass


async def generar_receta_gemini(prompt):
    try:
        # Usar el cliente para generar la receta
        response = client.models.generate_content(
            model=modelo_texto,
            contents=prompt
        )
        return response.text
    except Exception as e:
        raise GeminiGenerationError("Error al generar receta.") from e

async def detectar_ingredientes_gemini(prompt=None, imagen_file=None):
    try:
        contenido = await imagen_file.read()
        image = Image.open(BytesIO(contenido)).convert("RGB")
        
        # Usar el cliente para procesar imagen
        response = client.models.generate_content(
            model=modelo_texto,
            contents=[prompt, image]
        )
        return response.text
    except Exception as e:
        print(f"Error al identificar ingredientes: {str(e)}")
        return "Error al identificar ingredientes."
        
async def validar_y_adaptar_receta_con_gemini(prompt):
    try:
        # Usar el cliente para validar y adaptar receta
        response = client.models.generate_content(
            model=modelo_texto,
            contents=prompt
        )
        return response.text
    except Exception as e:
        raise GeminiGenerationError("Error al validar y adaptar receta.") from e

async def generar_imagen_receta(prompt):
    proveedor_imagen = settings.image_generation_provider.lower().strip()

    if proveedor_imagen == "cloudflare":
        return _generar_imagen_cloudflare(prompt)

    if proveedor_imagen == "gemini":
        return _generar_imagen_gemini(prompt)

    print(f"Proveedor de imagen no soportado: {settings.image_generation_provider}")
    return None


def _generar_imagen_cloudflare(prompt):
    if not settings.cloudflare_account_id or not settings.cloudflare_api_token:
        print("Cloudflare image generation is not configured; skipping image generation.")
        return None

    try:
        url = (
            f"{settings.cloudflare_api_base_url}"
            f"{settings.cloudflare_account_id}/ai/run/{settings.cloudflare_image_model}"
        )
        request = urllib.request.Request(
            url,
            data=json.dumps({"prompt": prompt, "steps": 4}).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.cloudflare_api_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))

        image_base64 = payload.get("result", {}).get("image")
        if not image_base64:
            print("Cloudflare image response did not include result.image.")
            return None

        if image_base64.startswith("data:"):
            image_base64 = image_base64.split(",", 1)[-1]

        return base64.b64decode(image_base64)

    except urllib.error.HTTPError as e:
        print(f"Error al generar imagen con Cloudflare: HTTP {e.code}")
        return None
    except Exception as e:
        print(f"Error al generar imagen con Cloudflare: {str(e)}")
        return None


def _generar_imagen_gemini(prompt):
    try:        
        # Usar el cliente para generar imagen
        response = client.models.generate_content(
            model=modelo_imagen,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE']
            )
        )

        # Verificar si hay candidatos
        if not response.candidates:
            return None

        # Procesar la respuesta 
        for part in response.candidates[0].content.parts:
            if part.inline_data is not None:                                
                # Devolver los bytes puros de la imagen para GridFS
                return part.inline_data.data

        return None

    except Exception as e:
        print(f"Error al generar imagen: {str(e)}")
        return None
