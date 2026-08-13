from typing import Optional, Dict, Any
from app.db.mongo_client import usuarios_collection
from bson import ObjectId
from app.db.mongo_client import recetas_collection
from app.models.plan_model import PlanUsuario, TipoPlan
from app.db.plan_repository import crear_plan_usuario, normalizar_datetime_utc, obtener_generaciones_periodo_actual
from datetime import datetime, timezone

async def get_user_by_email(email: str) -> Optional[dict]:
    return await usuarios_collection.find_one({"email": email})

async def create_user(email: str, hashed_password: str):
    # Crear plan gratuito por defecto
    plan_usuario = await crear_plan_usuario(TipoPlan.GRATUITO)
    
    return await usuarios_collection.insert_one({
        "email": email,
        "hashed_password": hashed_password,
        "favoritos": [],
        "plan": plan_usuario.dict()
    })

async def update_user_password(email: str, hashed_password: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed_password}}
    )

async def delete_user_by_email(email: str):
    return await usuarios_collection.delete_one({"email": email})


async def agregar_favorito(email: str, receta_id: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$addToSet": {"favoritos": ObjectId(receta_id)}}
    )

async def quitar_favorito(email: str, receta_id: str):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$pull": {"favoritos": ObjectId(receta_id)}}
    )

async def obtener_favoritos(email: str):
    usuario = await usuarios_collection.find_one({"email": email})
    if not usuario or "favoritos" not in usuario:
        return []

    ids = usuario["favoritos"]
    recetas = await recetas_collection.find({"_id": {"$in": ids}}).to_list(length=None)
    return recetas

async def obtener_plan_guardado(email: str, plan_fallback: PlanUsuario) -> PlanUsuario:
    usuario = await usuarios_collection.find_one({"email": email})
    if usuario and usuario.get("plan"):
        return PlanUsuario(**usuario["plan"])
    return plan_fallback

async def sincronizar_generaciones_plan(email: str, plan_usuario: PlanUsuario) -> PlanUsuario:
    generaciones_usadas = await obtener_generaciones_periodo_actual(email, plan_usuario)
    if generaciones_usadas <= plan_usuario.generaciones_usadas:
        return plan_usuario

    await usuarios_collection.update_one(
        filtro_plan_periodo(email, plan_usuario),
        {"$set": {"plan.generaciones_usadas": generaciones_usadas}}
    )
    plan_usuario.generaciones_usadas = generaciones_usadas
    return plan_usuario

def filtro_plan_periodo(email: str, plan_usuario: PlanUsuario) -> Dict[str, Any]:
    return {
        "email": email,
        "plan.tipo_plan": plan_usuario.tipo_plan.value,
        "plan.fecha_inicio_periodo": plan_usuario.fecha_inicio_periodo,
        "plan.fecha_fin_periodo": plan_usuario.fecha_fin_periodo
    }

async def obtener_plan_usuario(email: str) -> Optional[PlanUsuario]:
    usuario = await usuarios_collection.find_one({"email": email})
    if not usuario or "plan" not in usuario or not usuario["plan"]:
        plan_usuario = await crear_plan_usuario(TipoPlan.GRATUITO)
        await usuarios_collection.update_one(
            {"email": email},
            {"$set": {"plan": plan_usuario.dict()}}
        )
        return await sincronizar_generaciones_plan(email, await obtener_plan_guardado(email, plan_usuario))

    plan_usuario = PlanUsuario(**usuario["plan"])
    ahora = datetime.now(timezone.utc)
    fecha_fin_periodo = normalizar_datetime_utc(plan_usuario.fecha_fin_periodo)

    if fecha_fin_periodo <= ahora:
        plan_usuario = await crear_plan_usuario(plan_usuario.tipo_plan)
        await usuarios_collection.update_one(
            {"email": email},
            {"$set": {"plan": plan_usuario.dict()}}
        )
        return await obtener_plan_guardado(email, plan_usuario)

    return await sincronizar_generaciones_plan(email, plan_usuario)

async def actualizar_plan_usuario(email: str, plan: PlanUsuario):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"plan": plan.dict()}}
    )

async def reservar_generacion_plan(email: str, plan_usuario: PlanUsuario, limite: int) -> bool:
    if limite <= 0:
        return False

    filtro = filtro_plan_periodo(email, plan_usuario)
    filtro.update({
        "plan.activo": True,
        "$or": [
            {"plan.generaciones_usadas": {"$lt": limite}},
            {"plan.generaciones_usadas": {"$exists": False}}
        ]
    })

    result = await usuarios_collection.update_one(
        filtro,
        {"$inc": {"plan.generaciones_usadas": 1}}
    )
    return result.modified_count == 1

async def liberar_generacion_plan(email: str, plan_usuario: PlanUsuario) -> None:
    filtro = filtro_plan_periodo(email, plan_usuario)
    filtro["plan.generaciones_usadas"] = {"$gt": 0}

    await usuarios_collection.update_one(
        filtro,
        {"$inc": {"plan.generaciones_usadas": -1}}
    )
