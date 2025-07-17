# app/routers/imagenes_routes.py
from fastapi import APIRouter, HTTPException, Response
from app.db.mongo_client import gridfs_bucket
from bson import ObjectId

router = APIRouter()

@router.get("/imagenes/{imagen_id}")
async def get_imagen(imagen_id: str):
    try:
        # Buscar archivo en GridFS
        grid_out = await gridfs_bucket.open_download_stream(ObjectId(imagen_id))
        
        # Leer contenido del archivo
        content = await grid_out.read()
        
        # Obtener metadata
        content_type = grid_out.metadata.get("content_type", "image/png")
        
        return Response(content=content, media_type=content_type)
    except Exception as e:
        print(f"Error al obtener imagen {imagen_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
