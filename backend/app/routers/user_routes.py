from fastapi import APIRouter, HTTPException, Depends, Form
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user, create_refresh_token, refresh_access_token
from app.db.user_repository import get_user_by_email, create_user, update_user_password, delete_user_by_email
from app.models.usuario_model import UserCreate, UserUpdatePassword, UserPublic, UserDB
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.receta_serializer import serializar_receta
from app.db.user_repository import obtener_favoritos

router = APIRouter()

# Crear usuario (Registro)
@router.post("/register", response_model=dict)
async def register_user(usuario: UserCreate):
    existing = await get_user_by_email(usuario.email)
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya existe.")
    
    hashed = hash_password(usuario.password)
    await create_user(usuario.email, hashed)
    return {"msg": "Usuario registrado exitosamente."}

# Login
@router.post("/login", response_model=dict)
async def login_user(usuario: OAuth2PasswordRequestForm = Depends()):
    db_usario = await get_user_by_email(usuario.username)
    
    if not db_usario: 
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db_usario = UserDB(**db_usario)

    if not verify_password(usuario.password, db_usario.hashed_password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    access_token = create_access_token(data={"sub": db_usario.email})
    refresh_token = create_refresh_token(data={"sub": db_usario.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# Leer perfil del usuario autenticado
@router.get("/read", response_model=UserPublic)
async def read_user(current_user: dict = Depends(get_current_user)):
    recetas = await obtener_favoritos(current_user["email"])  # Obtener recetas completas
    recetas_serializadas = [serializar_receta(r) for r in recetas]
    return {
        "email": current_user["email"],
        "favoritos": recetas_serializadas
    }

# Actualizar contraseña
@router.put("/update", response_model=dict)
async def update_user_password_route(
    body: UserUpdatePassword,
    current_user: dict = Depends(get_current_user)
):
    hashed = hash_password(body.new_password)
    result = await update_user_password(current_user["email"], hashed)
    if result.modified_count == 1:
        return {"msg": "Contraseña actualizada correctamente."}
    else:
        raise HTTPException(status_code=400, detail="No se pudo actualizar la contraseña.")

# Eliminar usuario
@router.delete("/delete", response_model=dict)
async def delete_user(current_user: dict = Depends(get_current_user)):
    result = await delete_user_by_email(current_user["email"])
    if result.deleted_count == 1:
        return {"msg": "Usuario eliminado correctamente."}
    else:
        raise HTTPException(status_code=400, detail="No se pudo eliminar el usuario.")

# Refresh token
@router.post("/refresh", response_model=dict)
async def refresh_token(refresh_token: str = Form(...)):
    new_token = refresh_access_token(refresh_token)
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }
