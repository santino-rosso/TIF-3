from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from app.services.gemini_service import generar_receta_gemini, detectar_ingredientes_gemini, validar_y_adaptar_receta_con_gemini
from app.services.embedding_service import generar_embedding
from app.db.receta_repository import guardar_receta, buscar_recetas_similares
from app.utils.receta_serializer import serializar_receta
from app.utils.prompt_builder import formato_prompt_generar_receta, formato_prompt_detectar_ingredientes, formato_prompt_validar_receta
from app.models.receta_model import DatosReceta
from fastapi import Depends
from app.services.auth_service import get_current_user
from app.kag.validador import validar_ingredientes_con_restricciones
from fastapi import Form
from app.services.recomendador_service import obtener_recomendaciones_por_favoritos

router = APIRouter()

@router.post("/validar-ingredientes")
async def validar_ingredientes(restricciones: str = Form(""), ingredientes: str = Form(""), imagen: UploadFile = File(None), current_user: dict = Depends(get_current_user)):

    if not ingredientes and not imagen:
        return JSONResponse(content={"error": "Se debe proporcionar al menos ingredientes o una imagen de los mismos."}, status_code=400)

    if imagen:
        # Detectar ingredientes desde la imagen
        prompt_img = formato_prompt_detectar_ingredientes()
        ingredientes_detectados = await detectar_ingredientes_gemini(prompt_img, imagen)
        
        # Verificar si se devolvió un mensaje de error
        if isinstance(ingredientes_detectados, str) and ingredientes_detectados.startswith("Error al identificar ingredientes:"):
            return JSONResponse(content={"error": ingredientes_detectados}, status_code=500)

        ingredientes = ingredientes_detectados
        
    # Validar restricciones
    parsed_ingredientes, errores = validar_ingredientes_con_restricciones(ingredientes, restricciones)

    if errores:
        # Retornar los ingredientes con los errores encontrados
        return JSONResponse(content={
            "ingredientes_no_aprobados": errores, 
            "ingredientes": parsed_ingredientes
        }, status_code=200)
    
    # Si no hay errores, retornar los ingredientes validados
    return JSONResponse(content={
        "ingredientes_validados": parsed_ingredientes
    }, status_code=200)

@router.post("/generar-receta")
async def generar_receta(ingredientes: str = Form(""), preferencias: str = Form(""), restricciones: str = Form(""), tiempo: str = Form(""), tipo_comida: str = Form(""), herramientas: str = Form(""), experiencia: str = Form(""), current_user: dict = Depends(get_current_user)):
   
    datos_receta = DatosReceta(
        preferencias=preferencias,
        restricciones=restricciones,
        tiempo=tiempo,
        tipo_comida=tipo_comida,
        herramientas=herramientas,
        experiencia=experiencia,
        ingredientes=ingredientes,  
    )
    
    if not datos_receta.ingredientes :
        return JSONResponse(content={"error": "No se proporcionaron ingredientes para generar la receta."}, status_code=400)

    # Generar el prompt y la receta
    prompt = formato_prompt_generar_receta(datos_receta)
    receta_generada = await generar_receta_gemini(prompt)

    if not receta_generada or not receta_generada.strip():
        return JSONResponse(content={"error": "No se pudo generar la receta."}, status_code=500)
        
    # Validar y adaptar la receta generada para asegurar que cumpla con todos los requisitos
    prompt_validar = formato_prompt_validar_receta(receta_generada, datos_receta)
    receta_final = await validar_y_adaptar_receta_con_gemini(prompt_validar)
    
    # Generar embedding para la receta
    embedding = generar_embedding(receta_final)

    if not embedding or not isinstance(embedding, list) or len(embedding) == 0:
        return JSONResponse(content={"error": "Error al generar el embedding."}, status_code=500)
    
    # Buscar recetas similares en la base de datos
    recetas_similares, receta_duplicada = await buscar_recetas_similares(embedding)

    if not receta_duplicada:
        print("Receta no duplicada, guardando en la base de datos.")
        receta_id = await guardar_receta(receta_final, embedding)
        receta_generada_obj = {
            "_id": receta_id,
            "texto_receta": receta_final,
        } 
    else:
        print("Receta duplicada, se utilizara la receta existente.")
        receta_generada_obj = receta_duplicada

    recetas_similares_serializadas = [serializar_receta(r) for r in recetas_similares]

    # Retornar la receta generada y las recetas similares
    return JSONResponse(content={
        "receta_generada": receta_generada_obj,
        "recetas_similares": recetas_similares_serializadas
    }, status_code=200)

@router.get("/recetas-recomendadas")
async def recetas_recomendadas(current_user: dict = Depends(get_current_user)):
    # Recomendaciones personalizadas según favoritos/embedding
    recetas = await obtener_recomendaciones_por_favoritos(current_user["email"], top_k=10)
    recetas_serializadas = [serializar_receta(r) for r in recetas]
    return JSONResponse(content={"recomendadas": recetas_serializadas}, status_code=200)