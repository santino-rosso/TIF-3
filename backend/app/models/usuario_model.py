from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
from app.models.plan_model import PlanUsuario, TipoPlan


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class UserDB(BaseModel):
    email: EmailStr
    hashed_password: str
    is_admin: bool = False
    is_active: bool = True
    favoritos: list = Field(default_factory=list)
    plan: Optional[dict] = None
    creado_en: Optional[datetime] = None

class UserUpdatePassword(BaseModel):
    new_password: str = Field(min_length=6)

class UserPublic(BaseModel):
    email: EmailStr
    is_admin: bool = False
    is_active: bool = True
    creado_en: Optional[datetime] = None

class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    plan: Optional[dict] = None

    @field_validator("plan")
    @classmethod
    def validar_plan(cls, v):
        if v is None:
            return v
        tipo = v.get("tipo_plan")
        if tipo is None:
            raise ValueError("plan.tipo_plan es requerido")
        TipoPlan(tipo)  # valida que sea un tipo conocido
        return v

class UserLogout(BaseModel):
    refresh_token: str
