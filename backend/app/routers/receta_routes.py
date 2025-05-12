from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from app.services.gemini_service import generar_receta_gemini, detectar_ingredientes_gemini
from app.services.embedding_service import generar_embedding
from app.db.receta_repository import guardar_receta, buscar_recetas_similares
from app.utils.receta_serializer import serializar_receta
from app.utils.prompt_builder import formato_prompt_generar_receta, formato_prompt_detectar_ingredientes
from app.models.receta_model import DatosReceta
from fastapi import Depends
from app.services.auth_service import get_current_user

router = APIRouter()

@router.post("/generar-receta")
async def generar_receta(datos_receta: DatosReceta = Depends(), imagen: UploadFile = File(None), current_user: dict = Depends(get_current_user)):
    
    if not datos_receta.ingredientes and not imagen:
        return JSONResponse(content={"error": "Se debe proporcionar al menos ingredientes o una imagen de los mismos."}, status_code=400)

    if imagen:
        prompt_img = formato_prompt_detectar_ingredientes()

        ingredientes_detectados = await detectar_ingredientes_gemini(prompt_img, imagen)
        
        # Verificar si se devolvió un mensaje de error
        if isinstance(ingredientes_detectados, str) and ingredientes_detectados.startswith("Error al identificar ingredientes:"):
            print(f"Error detectado: {ingredientes_detectados}")
            return JSONResponse(content={"error": ingredientes_detectados}, status_code=500)

        datos_receta.ingredientes = ingredientes_detectados
        print(f"Ingredientes detectados: {ingredientes_detectados}")
        
    prompt = formato_prompt_generar_receta(datos_receta)
    receta_generada = await generar_receta_gemini(prompt)

    if not receta_generada or not receta_generada.strip():
        raise ValueError("El texto de la receta está vacío o no es válido.")

    embedding = generar_embedding(receta_generada)

    if not embedding or not isinstance(embedding, list) or len(embedding) == 0:
        print("Error al generar el embedding.")
        return JSONResponse(content={"error": "Error al generar el embedding."}, status_code=500)
    
    recetas_similares, receta_duplicada = await buscar_recetas_similares(embedding)

    if not receta_duplicada:
        print("Receta no duplicada, guardando en la base de datos.")
        receta_id = await guardar_receta(receta_generada, embedding)
        receta_generada = {
            "_id": receta_id,
            "texto_receta": receta_generada,
        } 
    else:
        print("Receta duplicada, se utilizara la receta existente.")
        receta_generada = receta_duplicada

    recetas_similares_serializadas = [serializar_receta(r) for r in recetas_similares]

    return JSONResponse(content={
        "receta_generada": receta_generada,
        "recetas_similares": recetas_similares_serializadas
    })
