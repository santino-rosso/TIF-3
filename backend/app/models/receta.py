from pydantic import BaseModel, field_validator
from typing import Optional

class DatosReceta(BaseModel):
    preferencias: Optional[str] = ""
    restricciones: Optional[str] = ""
    tiempo: Optional[str] = ""
    tipo_comida: Optional[str] = ""
    herramientas: Optional[str] = ""
    experiencia: Optional[str] = ""
    ingredientes: Optional[str] = ""

    @field_validator("preferencias", "restricciones", "tiempo", "tipo_comida", "herramientas", "experiencia", mode="before")
    @classmethod
    def limpiar_opcionales(cls, v):
        if not v or not str(v).strip():
            return "desconocido"
        return str(v).strip()

    @field_validator("ingredientes", mode="before")
    @classmethod
    def limpiar_ingredientes(cls, v):
        return str(v).strip() if v else None
    