import base64
import json
import urllib.error
import urllib.request

from app.config import settings


async def generar_imagen_cloudflare(prompt: str) -> bytes | None:
    """
    Genera una imagen usando Cloudflare Workers AI.
    Retorna bytes de la imagen o None si falla.
    """
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