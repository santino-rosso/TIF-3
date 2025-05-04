from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
from app.services.gemini_service import generar_receta_gemini, detectar_ingredientes_gemini
from app.services.embedding_service import generar_embedding
from app.db.guardar_receta import guardar_receta
from app.db.buscar_similares import buscar_recetas_similares
from app.utils.receta_serializer import serializar_receta
from app.utils.armar_prompt import formato_prompt_generar_receta, formato_prompt_detectar_ingredientes

router = APIRouter()

@router.post("/generar-receta")
async def generar_receta(
    imagen: UploadFile = File(None),
    preferencias: str = Form(""),
    restricciones: str = Form(""),
    tiempo: str = Form(""),
    tipo_comida: str = Form(""),
    herramientas: str = Form(""),
    experiencia: str = Form(""),
):
    datos_usuario = {
        "preferencias": preferencias,
        "restricciones": restricciones,
        "tiempo": tiempo,
        "tipo_comida": tipo_comida,
        "herramientas": herramientas,
        "experiencia": experiencia,
    }

    if imagen:
        print(f"Archivo recibido: {imagen.filename}")
        prompt_img = formato_prompt_detectar_ingredientes()
        ingredientes_detectados = await detectar_ingredientes_gemini(prompt_img, imagen)
        
        if ingredientes_detectados:
            datos_usuario["ingredientes"] = ingredientes_detectados
            print(f"Ingredientes detectados: {ingredientes_detectados}")
        else:
            print("No se detectaron ingredientes en la imagen.")
    else:
        print("No se recibió ninguna imagen.")
        
    prompt = formato_prompt_generar_receta(datos_usuario)
    receta_generada = await generar_receta_gemini(prompt)

    embedding = generar_embedding(receta_generada)

    recetas_similares, receta_duplicada = await buscar_recetas_similares(embedding)

    if not receta_duplicada:
        print("Receta no duplicada, guardando en la base de datos.")
        await guardar_receta(receta_generada, embedding)

    recetas_similares_serializadas = [serializar_receta(r) for r in recetas_similares]

    return JSONResponse(content={
        "receta_generada": receta_generada,
        "recetas_similares": recetas_similares_serializadas
    })
