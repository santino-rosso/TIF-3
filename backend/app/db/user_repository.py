from typing import Optional, Dict, Any
from app.db.mongo_client import usuarios_collection
from bson import ObjectId
from app.db.mongo_client import recetas_collection
from app.models.plan_model import PlanUsuario, TipoPlan
from app.db.plan_repository import crear_plan_usuario, normalizar_datetime_utc, obtener_generaciones_periodo_actual
from datetime import datetime, timezone, timedelta
import re

async def get_user_by_email(email: str) -> Optional[dict]:
    return await usuarios_collection.find_one({"email": email})

async def create_user(email: str, hashed_password: str):
    # Crear plan gratuito por defecto
    plan_usuario = await crear_plan_usuario(TipoPlan.GRATUITO)
    ahora = datetime.now(timezone.utc)

    return await usuarios_collection.insert_one({
        "email": email,
        "hashed_password": hashed_password,
        "is_admin": False,
        "is_active": True,
        "favoritos": [],
        "plan": plan_usuario.model_dump(),
        "creado_en": ahora
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
            {"$set": {"plan": plan_usuario.model_dump()}}
        )
        return await sincronizar_generaciones_plan(email, await obtener_plan_guardado(email, plan_usuario))

    plan_usuario = PlanUsuario(**usuario["plan"])
    ahora = datetime.now(timezone.utc)
    fecha_fin_periodo = normalizar_datetime_utc(plan_usuario.fecha_fin_periodo)

    if fecha_fin_periodo <= ahora:
        plan_usuario = await crear_plan_usuario(plan_usuario.tipo_plan)
        await usuarios_collection.update_one(
            {"email": email},
            {"$set": {"plan": plan_usuario.model_dump()}}
        )
        return await obtener_plan_guardado(email, plan_usuario)

    return await sincronizar_generaciones_plan(email, plan_usuario)

async def actualizar_plan_usuario(email: str, plan: PlanUsuario):
    return await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"plan": plan.model_dump()}}
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


# ===== ADMIN FUNCTIONS =====

async def listar_usuarios_admin(skip: int = 0, limit: int = 50, filtro_activo: Optional[bool] = None, filtro_admin: Optional[bool] = None,
                                 filtro_busqueda: Optional[str] = None, sort_by: Optional[str] = None, order: int = -1):
    query = {}
    if filtro_activo is not None:
        query["is_active"] = filtro_activo
    if filtro_admin is not None:
        query["is_admin"] = filtro_admin
    if filtro_busqueda:
        query["email"] = {"$regex": re.escape(filtro_busqueda), "$options": "i"}

    sort_field = sort_by if sort_by in ("email", "creado_en") else "creado_en"
    sort_order = order if order in (1, -1) else -1

    cursor = usuarios_collection.find(query, {"hashed_password": 0}).sort(sort_field, sort_order).skip(skip).limit(limit)
    usuarios = await cursor.to_list(length=limit)
    total = await usuarios_collection.count_documents(query)
    return usuarios, total


async def obtener_usuario_por_email_admin(email: str) -> Optional[dict]:
    return await usuarios_collection.find_one({"email": email}, {"hashed_password": 0})


async def toggle_usuario_activo(email: str, activo: bool) -> bool:
    result = await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"is_active": activo}}
    )
    return result.modified_count == 1


async def toggle_usuario_admin(email: str, admin: bool) -> bool:
    result = await usuarios_collection.update_one(
        {"email": email},
        {"$set": {"is_admin": admin}}
    )
    return result.modified_count == 1


async def obtener_stats_globales():
    total_usuarios = await usuarios_collection.count_documents({})
    usuarios_activos = await usuarios_collection.count_documents({"is_active": True})
    admins = await usuarios_collection.count_documents({"is_admin": True})

    # Usuarios por plan
    pipeline_plan = [
        {"$group": {"_id": "$plan.tipo_plan", "count": {"$sum": 1}}}
    ]
    planes_cursor = usuarios_collection.aggregate(pipeline_plan)
    planes = await planes_cursor.to_list(length=None)
    distribucion_planes = {p["_id"]: p["count"] for p in planes if p["_id"]}

    # Usuarios registrados últimos 30 días
    hace_30 = datetime.now(timezone.utc) - timedelta(days=30)
    nuevos_30 = await usuarios_collection.count_documents({"creado_en": {"$gte": hace_30}})

    return {
        "total_usuarios": total_usuarios,
        "usuarios_activos": usuarios_activos,
        "admins": admins,
        "distribucion_planes": distribucion_planes,
        "nuevos_30_dias": nuevos_30
    }
