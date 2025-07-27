from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TipoPlan(str, Enum):
    GRATUITO = "gratuito"
    PREMIUM = "premium"

class Plan(BaseModel):
    tipo: TipoPlan
    limite_generaciones_mensual: int
    precio: float = 0.0
    nombre: str
    descripcion: str
    
class PlanUsuario(BaseModel):
    tipo_plan: TipoPlan
    generaciones_usadas: int = 0
    fecha_inicio_periodo: datetime
    fecha_fin_periodo: datetime
    activo: bool = True

class GeneracionReceta(BaseModel):
    usuario_email: str
    fecha_generacion: datetime
    receta_id: Optional[str] = None
