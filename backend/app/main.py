from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers.receta_routes import router as receta_router
from app.routers.user_routes import router as user_router
from app.db.mongo_client import create_index, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código de inicio de la aplicación
    print("Iniciando la aplicación...")
    try:
        # Crear índices en la base de datos al iniciar la aplicación
        await create_index()
        print("Índices creados en la base de datos.")
    except Exception as e:
        print(f"Error al crear índices: {e}")
        raise
    
    yield # Aca se ejecuta la aplicación

    # Código de cierre de la aplicación
    print("Cerrando la aplicación...")
    await close_mongo_connection()
    print("Conexión a la base de datos cerrada.")

app = FastAPI(title="API de Recetas con Gemini", lifespan=lifespan)

app.include_router(receta_router, prefix="/api")
app.include_router(user_router, prefix="/api")

