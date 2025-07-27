from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from bson import ObjectId
from pydantic.json_schema import JsonSchemaValue
from pydantic.json_schema import GetJsonSchemaHandler
from app.models.plan_model import PlanUsuario

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, context=None):
        if not ObjectId.is_valid(v):
            raise ValueError("ID no válido")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: JsonSchemaValue, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string"}

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class UserDB(BaseModel):
    email: EmailStr
    hashed_password: str
    favoritos: List[PyObjectId] = []
    plan: Optional[PlanUsuario] = None

class UserUpdatePassword(BaseModel):
    new_password: str = Field(min_length=6)

class UserPublic(BaseModel):
    email: EmailStr
    favoritos: List[dict] = []  

class UserLogout(BaseModel):
    refresh_token: str
