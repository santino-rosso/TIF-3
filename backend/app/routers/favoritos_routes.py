from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from fastapi.responses import JSONResponse
from app.db.user_repository import agregar_favorito, quitar_favorito, obtener_favoritos
from app.utils.receta_serializer import serializar_receta
from app.services.auth_service import get_current_user

router = APIRouter()

@router.post("/favoritos/{receta_id}")
async def agregar_a_favoritos(receta_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(receta_id):
        raise HTTPException(status_code=400, detail="ID de receta inválido")
    
    resultado = await agregar_favorito(current_user["email"], receta_id)
    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="No se pudo agregar a favoritos")
    return {"mensaje": "Receta agregada a favoritos"}

@router.delete("/favoritos/{receta_id}")
async def quitar_de_favoritos(receta_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(receta_id):
        raise HTTPException(status_code=400, detail="ID de receta inválido")
    
    resultado = await quitar_favorito(current_user["email"], receta_id)
    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="No se pudo quitar de favoritos")
    return {"mensaje": "Receta eliminada de favoritos"}

@router.get("/favoritos")
async def obtener_favoritos_usuario(current_user: dict = Depends(get_current_user)):
    recetas = await obtener_favoritos(current_user["email"])
    recetas_serializadas = [serializar_receta(r) for r in recetas]
    return JSONResponse(content={"favoritos": recetas_serializadas})
