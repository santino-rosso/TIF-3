from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers.receta_routes import router as receta_router
from app.routers.user_routes import router as user_router
from app.db.mongo_client import create_index, close_mongo_connection, crear_index_tokens
from app.routers.favoritos_routes import router as favoritos_router
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código de inicio de la aplicación
    print("Iniciando la aplicación...")
    try:
        # Crear índices en la base de datos al iniciar la aplicación
        await create_index()
        await crear_index_tokens()
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

app.include_router(receta_router, prefix="/api", tags=["Recetas"])
app.include_router(user_router, prefix="/api", tags=["Usuarios"])
app.include_router(favoritos_router, prefix="/api", tags=["Favoritos"])

# Configuración de CORS
# Permitir solicitudes desde el frontend en localhost:4173 y localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173", "http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)