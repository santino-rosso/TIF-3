import asyncio

from fastapi import APIRouter, Depends, File, Form, UploadFile, Request
from fastapi.responses import JSONResponse
from app.services.gemini_service import GeminiGenerationError, generar_receta_gemini, detectar_ingredientes_gemini, validar_y_adaptar_receta_con_gemini, generar_imagen_receta
from app.services.embedding_service import generar_embedding
from app.db.receta_repository import guardar_receta, buscar_recetas_similares
from app.db.plan_repository import puede_generar_receta, registrar_generacion
from app.db.user_repository import obtener_plan_usuario, reservar_generacion_plan, liberar_generacion_plan
from app.utils.receta_serializer import serializar_receta
from app.utils.prompt_builder import formato_prompt_generar_receta, formato_prompt_detectar_ingredientes, formato_prompt_validar_receta, formato_prompt_generar_imagen
from app.models.receta_model import DatosReceta
from app.services.auth_service import get_current_user
from app.kag.validador import validar_ingredientes_con_restricciones
from app.services.recomendador_service import obtener_recomendaciones_por_favoritos
from app.utils.extraer_nombre_receta import extraer_nombre
from app.rate_limit import limiter

router = APIRouter()

def respuesta_limite_alcanzado(verificacion: dict) -> JSONResponse:
    return JSONResponse(content={
        "error": "Límite de generaciones alcanzado",
        "detalle": verificacion.get("razon", "Has alcanzado el límite de recetas en tu período actual"),
        "generaciones_usadas": verificacion.get("generaciones_usadas", 0),
        "limite": verificacion.get("limite", 0),
        "restantes": verificacion.get("restantes", 0),
        "tipo": "limite_alcanzado"
    }, status_code=403)

async def liberar_reserva_generacion(email: str, plan_usuario) -> None:
    try:
        await liberar_generacion_plan(email, plan_usuario)
    except Exception as e:
        print(f"Error al liberar reserva de generación: {str(e)}")

@router.post("/validar-ingredientes")
async def validar_ingredientes(restricciones: str = Form(""), ingredientes: str = Form(""), imagen: UploadFile = File(None)):
    if not ingredientes and not imagen:
        return JSONResponse(content={"error": "Se debe proporcionar al menos ingredientes o una imagen de los mismos."}, status_code=400)

    if imagen:
        # Detectar ingredientes desde la imagen
        prompt_img = formato_prompt_detectar_ingredientes()
        ingredientes_detectados = await detectar_ingredientes_gemini(prompt_img, imagen)
        
        # Verificar si se devolvió un mensaje de error
        if isinstance(ingredientes_detectados, str) and ingredientes_detectados.startswith("Error al identificar ingredientes"):
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
@limiter.limit("10/minute")
async def generar_receta(request: Request, ingredientes: str = Form(""), preferencias: str = Form(""), restricciones: str = Form(""), tiempo: str = Form(""), tipo_comida: str = Form(""), herramientas: str = Form(""), experiencia: str = Form(""), current_user: dict = Depends(get_current_user)):
    datos_receta = DatosReceta(
        preferencias=preferencias,
        restricciones=restricciones,
        tiempo=tiempo,
        tipo_comida=tipo_comida,
        herramientas=herramientas,
        experiencia=experiencia,
        ingredientes=ingredientes,  
    )

    if not datos_receta.ingredientes:
        return JSONResponse(content={"error": "No se proporcionaron ingredientes para generar la receta."}, status_code=400)

    plan_usuario = None
    reserva_realizada = False

    # Verificar límites del plan antes de generar
    try:
        plan_usuario = await obtener_plan_usuario(current_user["email"])
        if not plan_usuario:
            return JSONResponse(content={"error": "No se pudo obtener el plan del usuario."}, status_code=500)

        verificacion = await puede_generar_receta(current_user["email"], plan_usuario)
        if not verificacion["puede_generar"]:
            return respuesta_limite_alcanzado(verificacion)

        reserva_realizada = await reservar_generacion_plan(
            current_user["email"],
            plan_usuario,
            verificacion["limite"]
        )
        if not reserva_realizada:
            plan_usuario_actualizado = await obtener_plan_usuario(current_user["email"])
            verificacion_actualizada = await puede_generar_receta(current_user["email"], plan_usuario_actualizado)
            if verificacion_actualizada["puede_generar"]:
                reserva_realizada = await reservar_generacion_plan(
                    current_user["email"],
                    plan_usuario_actualizado,
                    verificacion_actualizada["limite"]
                )
                if reserva_realizada:
                    plan_usuario = plan_usuario_actualizado
                else:
                    plan_usuario_actualizado = await obtener_plan_usuario(current_user["email"])
                    verificacion_actualizada = await puede_generar_receta(current_user["email"], plan_usuario_actualizado)
            if not reserva_realizada:
                return respuesta_limite_alcanzado(verificacion_actualizada)
    except asyncio.CancelledError:
        if reserva_realizada and plan_usuario:
            await liberar_reserva_generacion(current_user["email"], plan_usuario)
        raise
    except Exception as e:
        print(f"Error al verificar límites: {str(e)}")
        return JSONResponse(content={"error": "Error al verificar límites."}, status_code=500)

    try:
        # Generar el prompt y la receta
        prompt = formato_prompt_generar_receta(datos_receta)
        receta_generada = await generar_receta_gemini(prompt)

        if not receta_generada or not receta_generada.strip():
            await liberar_reserva_generacion(current_user["email"], plan_usuario)
            return JSONResponse(content={"error": "No se pudo generar la receta."}, status_code=500)

        # Validar y adaptar la receta generada para asegurar que cumpla con todos los requisitos
        prompt_validar = formato_prompt_validar_receta(receta_generada, datos_receta)
        receta_final = await validar_y_adaptar_receta_con_gemini(prompt_validar)
        
        # Generar imagen de la receta
        nombre_receta = extraer_nombre(receta_final)
        prompt_imagen = formato_prompt_generar_imagen(nombre_receta, datos_receta.ingredientes)
        imagen_bytes = await generar_imagen_receta(prompt_imagen)

        # Generar embedding para la receta
        embedding = generar_embedding(receta_final)

        if not embedding or not isinstance(embedding, list) or len(embedding) == 0:
            await liberar_reserva_generacion(current_user["email"], plan_usuario)
            return JSONResponse(content={"error": "Error al generar el embedding."}, status_code=500)

        # Buscar recetas similares en la base de datos
        recetas_similares, receta_duplicada = await buscar_recetas_similares(embedding)

        if not receta_duplicada:
            print("Receta no duplicada, guardando en la base de datos.")
            receta_id, imagen_id = await guardar_receta(receta_final, embedding, imagen_bytes, nombre_receta)
            receta_generada_obj = {
                "_id": receta_id,
                "texto_receta": receta_final,
                "imagen_id": imagen_id
            }
        else:
            print("Receta duplicada, se utilizará la receta existente.")
            receta_generada_obj = receta_duplicada

        receta_generada_obj = serializar_receta(receta_generada_obj)

        recetas_similares_serializadas = [serializar_receta(r) for r in recetas_similares]
    except asyncio.CancelledError:
        await liberar_reserva_generacion(current_user["email"], plan_usuario)
        raise
    except GeminiGenerationError as e:
        await liberar_reserva_generacion(current_user["email"], plan_usuario)
        return JSONResponse(content={"error": str(e)}, status_code=500)
    except Exception as e:
        await liberar_reserva_generacion(current_user["email"], plan_usuario)
        print(f"Error al generar receta: {str(e)}")
        return JSONResponse(content={"error": "Error al generar receta."}, status_code=500)

    # Registrar la generación como auditoría/historial. El cupo ya fue consumido por la reserva.
    try:
        receta_id_para_registro = receta_generada_obj.get("_id")
        await registrar_generacion(current_user["email"], str(receta_id_para_registro) if receta_id_para_registro else None)
    except asyncio.CancelledError:
        await liberar_reserva_generacion(current_user["email"], plan_usuario)
        raise
    except Exception as e:
        print(f"Error al registrar generación: {str(e)}")

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
