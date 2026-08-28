from fastapi import APIRouter, Depends, Body
from fastapi.responses import JSONResponse
from typing import Optional
from pydantic import ValidationError
from app.services.auth_service import get_current_user
from app.db.plan_repository import obtener_todos_los_planes, obtener_estadisticas_usuario, puede_generar_receta, crear_plan_usuario
from app.db.user_repository import obtener_plan_usuario, actualizar_plan_usuario
from app.models.plan_model import TipoPlan
from app.models.payment_model import PaymentData

router = APIRouter()

@router.get("/planes")
async def obtener_planes():
    planes = await obtener_todos_los_planes()
    return {"planes": [plan.model_dump() for plan in planes]}

@router.get("/obtener-plan")
async def obtener_mi_plan(current_user: dict = Depends(get_current_user)):
    try:
        plan_usuario = await obtener_plan_usuario(current_user["email"])
        if not plan_usuario:
            return JSONResponse(
                content={"error": "No se pudo obtener el plan del usuario"}, 
                status_code=404
            )
        
        estadisticas = await obtener_estadisticas_usuario(current_user["email"], plan_usuario)
        
        return {
            "plan": plan_usuario.model_dump(),
            "estadisticas": estadisticas
        }
    except Exception as e:
        return JSONResponse(
            content={"error": f"Error al obtener plan: {str(e)}"}, 
            status_code=500
        )

@router.get("/verificar-limite")
async def verificar_limite_generacion(current_user: dict = Depends(get_current_user)):
    try:
        plan_usuario = await obtener_plan_usuario(current_user["email"])
        if not plan_usuario:
            return JSONResponse(
                content={"error": "No se pudo obtener el plan del usuario"}, 
                status_code=404
            )
        
        resultado = await puede_generar_receta(current_user["email"], plan_usuario)
        return resultado
    except Exception as e:
        return JSONResponse(
            content={"error": f"Error al verificar límite: {str(e)}"}, 
            status_code=500
        )

@router.post("/actualizar-plan/{tipo_plan}")
async def actualizar_plan(
    tipo_plan: str,
    current_user: dict = Depends(get_current_user),
    payment_data: Optional[dict] = Body(None)
):
    try:
        # Validar tipo de plan
        if tipo_plan not in [TipoPlan.GRATUITO.value, TipoPlan.PREMIUM.value]:
            return JSONResponse(
                content={"error": "Tipo de plan inválido"}, 
                status_code=400
            )

        if tipo_plan == TipoPlan.PREMIUM.value:
            if not payment_data:
                return JSONResponse(
                    content={"error": "Se requieren datos de tarjeta para actualizar a Premium"}, 
                    status_code=400
                )
            try:
                PaymentData(**payment_data)
            except ValidationError:
                return JSONResponse(
                    content={"error": "Datos de tarjeta inválidos"}, 
                    status_code=400
                )
        
        plan_tipo = TipoPlan(tipo_plan)
        
        nuevo_plan = await crear_plan_usuario(plan_tipo)
        
        # Actualizar en la base de datos
        result = await actualizar_plan_usuario(current_user["email"], nuevo_plan)
        
        if result.modified_count == 1:
            return {
                "mensaje": f"Plan actualizado a {plan_tipo.value} exitosamente",
                "plan": nuevo_plan.model_dump()
            }
        else:
            return JSONResponse(
                content={"error": "No se pudo actualizar el plan"}, 
                status_code=400
            )
            
    except Exception as e:
        return JSONResponse(
            content={"error": f"Error al actualizar plan: {str(e)}"}, 
            status_code=500
        )
