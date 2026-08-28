from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta, timezone
from app.db.mongo_client import planes_collection, generaciones_collection
from app.models.plan_model import Plan, TipoPlan, PlanUsuario, GeneracionReceta

# Fuente única de verdad para los planes.
# Mongo solo copia estos datos para consultas externas.
# El sistema debe leer este archivo para evitar que datos viejos alteren los límites.
PLANES_DISPONIBLES = {
    TipoPlan.GRATUITO: Plan(
        tipo=TipoPlan.GRATUITO,
        limite_generaciones_mensual=5,
        precio=0.0,
        nombre="Plan Gratuito",
        descripcion="Hasta 5 recetas cada 30 días, perfecto para empezar"
    ),
    TipoPlan.PREMIUM: Plan(
        tipo=TipoPlan.PREMIUM,
        limite_generaciones_mensual=100,
        precio=9.99,
        nombre="Plan Premium",
        descripcion="Hasta 100 recetas cada 30 días, ideal para apasionados de la cocina"
    )
}

async def inicializar_planes():
    for plan in PLANES_DISPONIBLES.values():
        await planes_collection.update_one(
            {"tipo": plan.tipo},
            {"$set": plan.model_dump()},
            upsert=True
        )

async def obtener_plan_por_tipo(tipo: TipoPlan) -> Optional[Plan]:
    return PLANES_DISPONIBLES.get(tipo)

async def obtener_todos_los_planes() -> List[Plan]:
    return list(PLANES_DISPONIBLES.values())

async def crear_plan_usuario(tipo_plan: TipoPlan = TipoPlan.GRATUITO) -> PlanUsuario:
    ahora = datetime.now(timezone.utc)
    plan_usuario = PlanUsuario(
        tipo_plan=tipo_plan,
        generaciones_usadas=0,
        fecha_inicio_periodo=ahora,
        fecha_fin_periodo=ahora + timedelta(days=30),
        activo=True
    )
    return plan_usuario

async def registrar_generacion(email: str, receta_id: Optional[str] = None):
    generacion = GeneracionReceta(
        usuario_email=email,
        fecha_generacion=datetime.now(timezone.utc),
        receta_id=receta_id
    )
    await generaciones_collection.insert_one(generacion.model_dump())

def normalizar_datetime_utc(fecha: datetime) -> datetime:
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=timezone.utc)
    return fecha.astimezone(timezone.utc)

async def obtener_generaciones_periodo_actual(email: str, plan_usuario: PlanUsuario) -> int:
    inicio_periodo = normalizar_datetime_utc(plan_usuario.fecha_inicio_periodo)
    fin_periodo = normalizar_datetime_utc(plan_usuario.fecha_fin_periodo)
    generaciones_historicas = await generaciones_collection.count_documents({
        "usuario_email": email,
        "fecha_generacion": {
            "$gte": inicio_periodo,
            "$lt": fin_periodo
        }
    })
    return max(plan_usuario.generaciones_usadas, generaciones_historicas)

async def puede_generar_receta(email: str, plan_usuario: PlanUsuario) -> Dict[str, Any]:
    generaciones_usadas = await obtener_generaciones_periodo_actual(email, plan_usuario)
    plan = await obtener_plan_por_tipo(plan_usuario.tipo_plan)
    
    if not plan:
        return {"puede_generar": False, "razon": "Plan no encontrado"}
    
    if generaciones_usadas >= plan.limite_generaciones_mensual:
        return {
            "puede_generar": False,
            "razon": f"Has alcanzado el límite de {plan.limite_generaciones_mensual} recetas en tu período actual",
            "generaciones_usadas": generaciones_usadas,
            "limite": plan.limite_generaciones_mensual,
            "restantes": 0
        }
    
    return {
        "puede_generar": True,
        "generaciones_usadas": generaciones_usadas,
        "limite": plan.limite_generaciones_mensual,
        "restantes": plan.limite_generaciones_mensual - generaciones_usadas
    }

async def obtener_estadisticas_usuario(email: str, plan_usuario: PlanUsuario) -> Dict[str, Any]:
    generaciones_usadas = await obtener_generaciones_periodo_actual(email, plan_usuario)
    plan = await obtener_plan_por_tipo(plan_usuario.tipo_plan)
    
    if not plan:
        return {}
    
    return {
        "tipo_plan": plan.tipo,
        "nombre_plan": plan.nombre,
        "descripcion_plan": plan.descripcion,
        "precio": plan.precio,
        "generaciones_usadas": generaciones_usadas,
        "limite_generaciones": plan.limite_generaciones_mensual,
        "generaciones_restantes": max(0, plan.limite_generaciones_mensual - generaciones_usadas),
        "porcentaje_uso": round((generaciones_usadas / plan.limite_generaciones_mensual) * 100, 1) if plan.limite_generaciones_mensual > 0 else 0,
        "fecha_renovacion": plan_usuario.fecha_fin_periodo
    }
