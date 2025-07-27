from typing import Optional, Dict, List
from datetime import datetime, timedelta, timezone
from app.db.mongo_client import planes_collection, generaciones_collection
from app.models.plan_model import Plan, TipoPlan, PlanUsuario, GeneracionReceta

# Planes predefinidos
PLANES_DISPONIBLES = {
    TipoPlan.GRATUITO: Plan(
        tipo=TipoPlan.GRATUITO,
        limite_generaciones_mensual=5,
        precio=0.0,
        nombre="Plan Gratuito",
        descripcion="Hasta 5 recetas por mes, perfecto para empezar"
    ),
    TipoPlan.PREMIUM: Plan(
        tipo=TipoPlan.PREMIUM,
        limite_generaciones_mensual=100,
        precio=9.99,
        nombre="Plan Premium",
        descripcion="Hasta 100 recetas por mes, ideal para apasionados de la cocina"
    )
}

async def inicializar_planes():
    for plan in PLANES_DISPONIBLES.values():
        existing = await planes_collection.find_one({"tipo": plan.tipo})
        if not existing:
            await planes_collection.insert_one(plan.dict())

async def obtener_plan_por_tipo(tipo: TipoPlan) -> Optional[Plan]:
    plan_data = await planes_collection.find_one({"tipo": tipo})
    if plan_data:
        return Plan(**plan_data)
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
    await generaciones_collection.insert_one(generacion.dict())

async def obtener_generaciones_mes_actual(email: str) -> int:
    ahora = datetime.now(timezone.utc)
    inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    count = await generaciones_collection.count_documents({
        "usuario_email": email,
        "fecha_generacion": {"$gte": inicio_mes}
    })
    return count

async def puede_generar_receta(email: str, plan_usuario: PlanUsuario) -> Dict[str, any]:
    generaciones_usadas = await obtener_generaciones_mes_actual(email)
    plan = await obtener_plan_por_tipo(plan_usuario.tipo_plan)
    
    if not plan:
        return {"puede_generar": False, "razon": "Plan no encontrado"}
    
    if generaciones_usadas >= plan.limite_generaciones_mensual:
        return {
            "puede_generar": False,
            "razon": f"Has alcanzado el límite de {plan.limite_generaciones_mensual} recetas por mes",
            "generaciones_usadas": generaciones_usadas,
            "limite": plan.limite_generaciones_mensual
        }
    
    return {
        "puede_generar": True,
        "generaciones_usadas": generaciones_usadas,
        "limite": plan.limite_generaciones_mensual,
        "restantes": plan.limite_generaciones_mensual - generaciones_usadas
    }

async def obtener_estadisticas_usuario(email: str, plan_usuario: PlanUsuario) -> Dict[str, any]:
    generaciones_usadas = await obtener_generaciones_mes_actual(email)
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
