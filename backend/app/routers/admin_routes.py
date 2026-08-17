import re
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.services.auth_service import require_admin
from app.db.user_repository import (
    listar_usuarios_admin,
    obtener_usuario_por_email_admin,
    toggle_usuario_activo,
    toggle_usuario_admin,
    actualizar_plan_usuario,
    obtener_stats_globales
)
from app.db.plan_repository import crear_plan_usuario
from app.models.plan_model import TipoPlan
from app.models.usuario_model import UserAdminUpdate
from app.db.receta_repository import recetas_collection
from app.db.mongo_client import generaciones_collection, usuarios_collection, gridfs_bucket
from app.utils.receta_serializer import serializar_receta
from datetime import datetime, timezone, timedelta
from bson import ObjectId

router = APIRouter()


def serializar_usuario_admin(usuario):
    usuario_serializado = usuario.copy()

    if "_id" in usuario_serializado and usuario_serializado["_id"] is not None:
        usuario_serializado["_id"] = str(usuario_serializado["_id"])

    if "creado_en" in usuario_serializado and hasattr(usuario_serializado["creado_en"], "isoformat"):
        usuario_serializado["creado_en"] = usuario_serializado["creado_en"].isoformat()

    plan = usuario_serializado.get("plan")
    if isinstance(plan, dict):
        for campo in ("fecha_inicio_periodo", "fecha_fin_periodo"):
            if campo in plan and hasattr(plan[campo], "isoformat"):
                plan[campo] = plan[campo].isoformat()

    favoritos = usuario_serializado.get("favoritos")
    if isinstance(favoritos, list):
        usuario_serializado["favoritos"] = [str(f) if isinstance(f, ObjectId) else f for f in favoritos]

    return usuario_serializado

# Estadísticas globales para dashboard admin
@router.get("/stats")
async def obtener_stats_admin(current_user: dict = Depends(require_admin)):
    try:
        # Stats de usuarios
        stats_usuarios = await obtener_stats_globales()

        # Stats de recetas
        total_recetas = await recetas_collection.count_documents({})
        recetas_con_imagen = await recetas_collection.count_documents({"imagen_id": {"$ne": None}})

        # Generaciones últimos 30 días
        hace_30 = datetime.now(timezone.utc) - timedelta(days=30)
        pipeline_gen = [
            {"$match": {"fecha_generacion": {"$gte": hace_30}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$fecha_generacion"}},
                "total": {"$sum": 1},
                "exitosas": {"$sum": {"$cond": [{"$ne": ["$receta_id", None]}, 1, 0]}},
                "fallidas": {"$sum": {"$cond": [{"$eq": ["$receta_id", None]}, 1, 0]}}
            }},
            {"$sort": {"_id": 1}}
        ]
        gen_cursor = generaciones_collection.aggregate(pipeline_gen)
        generaciones_30 = await gen_cursor.to_list(length=None)

        # Usuarios registrados por día (últimos 30 días)
        hace_30 = datetime.now(timezone.utc) - timedelta(days=30)
        pipeline_users = [
            {"$match": {"creado_en": {"$gte": hace_30}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$creado_en"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        users_cursor = usuarios_collection.aggregate(pipeline_users)
        usuarios_30 = await users_cursor.to_list(length=None)

        return {
            "usuarios": {
                "total": stats_usuarios.get("total_usuarios", 0),
                "activos": stats_usuarios.get("usuarios_activos", 0),
                "admins": stats_usuarios.get("admins", 0),
                "distribucion_planes": stats_usuarios.get("distribucion_planes", {}),
                "nuevos_30_dias": stats_usuarios.get("nuevos_30_dias", 0),
                "serie_30_dias": [{"fecha": u["_id"], "count": u["count"]} for u in usuarios_30]
            },
            "recetas": {
                "total": total_recetas,
                "con_imagen": recetas_con_imagen,
                "sin_imagen": total_recetas - recetas_con_imagen
            },
            "generaciones": {
                "serie_30_dias": [
                    {
                        "fecha": g["_id"],
                        "total": g["total"],
                        "exitosas": g["exitosas"],
                        "fallidas": g["fallidas"]
                    } for g in generaciones_30
                ]
            }
        }
    except Exception as e:
        print(f"Error al cargar estadísticas: {e}")
        return JSONResponse(content={"error": "Error al cargar estadísticas"}, status_code=500)


# Lista usuarios con paginación, filtros y ordenamiento
@router.get("/users")
async def listar_usuarios(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    activo: bool | None = Query(None),
    admin: bool | None = Query(None),
    search: Optional[str] = Query(None, max_length=100),
    sort_by: str | None = Query(None),
    order: int = Query(-1),
    current_user: dict = Depends(require_admin)
):
    usuarios, total = await listar_usuarios_admin(skip=skip, limit=limit, filtro_activo=activo, filtro_admin=admin,
                                                  filtro_busqueda=search, sort_by=sort_by, order=order)
    return {
        "usuarios": [serializar_usuario_admin(u) for u in usuarios],
        "total": total,
        "skip": skip,
        "limit": limit
    }


# Obtener detalle completo de un usuario
@router.get("/users/{email}")
async def obtener_usuario(email: str, current_user: dict = Depends(require_admin)):
    usuario = await obtener_usuario_por_email_admin(email)
    if not usuario:
        return JSONResponse(content={"error": "Usuario no encontrado"}, status_code=404)
    return serializar_usuario_admin(usuario)


# Actualizar campos de un usuario (is_active, is_admin, plan)
@router.patch("/users/{email}")
async def actualizar_usuario(
    email: str,
    datos: UserAdminUpdate,
    current_user: dict = Depends(require_admin)
):
    usuario = await obtener_usuario_por_email_admin(email)
    if not usuario:
        return JSONResponse(content={"error": "Usuario no encontrado"}, status_code=404)

    if (datos.is_admin is False or datos.is_active is False) and email == current_user["email"]:
        return JSONResponse(content={"error": "No puedes quitarte permisos de administrador a ti mismo"}, status_code=400)

    resultados = {}

    if datos.is_active is not None:
        ok = await toggle_usuario_activo(email, datos.is_active)
        resultados["is_active"] = ok

    if datos.is_admin is not None:
        ok = await toggle_usuario_admin(email, datos.is_admin)
        resultados["is_admin"] = ok

    if datos.plan is not None:
        tipo_plan = TipoPlan(datos.plan["tipo_plan"])
        nuevo_plan = await crear_plan_usuario(tipo_plan)
        result = await actualizar_plan_usuario(email, nuevo_plan)
        resultados["plan"] = result.modified_count == 1

    if not resultados:
        return JSONResponse(content={"error": "No se proporcionaron campos válidos"}, status_code=400)

    return {"actualizado": resultados}


# Lista recetas con paginación y filtros
@router.get("/recipes")
async def listar_recetas_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    con_imagen: bool | None = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    order: Optional[str] = Query("desc"),
    current_user: dict = Depends(require_admin)
):
    query = {}
    if con_imagen is not None:
        if con_imagen:
            query["imagen_id"] = {"$ne": None}
        else:
            query["imagen_id"] = None

    if search:
        query["texto_receta"] = {"$regex": re.escape(search), "$options": "i"}

    sort_field = sort if sort in ("fecha",) else "fecha"
    sort_order = 1 if order == "asc" else -1

    cursor = recetas_collection.find(query, {"embedding": 0}).sort(sort_field, sort_order).skip(skip).limit(limit)
    recetas = await cursor.to_list(length=limit)
    total = await recetas_collection.count_documents(query)

    recetas_serializadas = [serializar_receta(r) for r in recetas]

    return {
        "recetas": recetas_serializadas,
        "total": total,
        "skip": skip,
        "limit": limit
    }


# Eliminar una receta por su ID
@router.delete("/recipes/{recipe_id}")
async def eliminar_receta(recipe_id: str, current_user: dict = Depends(require_admin)):
    try:
        obj_id = ObjectId(recipe_id)
    except Exception:
        return JSONResponse(content={"error": "ID de receta inválido"}, status_code=400)

    receta = await recetas_collection.find_one({"_id": obj_id})
    if receta:
        imagen_id = receta.get("imagen_id")
        if imagen_id is not None:
            try:
                await gridfs_bucket.delete(ObjectId(imagen_id))
            except Exception:
                # Si la imagen ya no existe en GridFS, no debe fallar el delete del doc
                pass

    result = await recetas_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        return JSONResponse(content={"error": "Receta no encontrada"}, status_code=404)
    return {"mensaje": "Receta eliminada correctamente"}


# Lista generaciones con paginación
@router.get("/generations")
async def listar_generaciones(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    cursor = generaciones_collection.find().sort("fecha_generacion", -1).skip(skip).limit(limit)
    generaciones = await cursor.to_list(length=limit)
    total = await generaciones_collection.count_documents({})

    generaciones_serializadas = []
    for generacion in generaciones:
        generacion = generacion.copy()
        if "_id" in generacion and generacion["_id"] is not None:
            generacion["_id"] = str(generacion["_id"])
        if "fecha_generacion" in generacion and hasattr(generacion["fecha_generacion"], "isoformat"):
            generacion["fecha_generacion"] = generacion["fecha_generacion"].isoformat()
        generaciones_serializadas.append(generacion)

    return {
        "generaciones": generaciones_serializadas,
        "total": total,
        "skip": skip,
        "limit": limit
    }