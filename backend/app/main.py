from fastapi import FastAPI
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.routers.receta_routes import router as receta_router
from app.routers.user_routes import router as user_router
from app.routers.imagenes_routes import router as imagenes_router
from app.routers.plan_routes import router as plan_router
from app.routers.admin_routes import router as admin_router
from app.db.mongo_client import create_index, close_mongo_connection, crear_index_tokens, init_mongo_connection
from app.routers.favoritos_routes import router as favoritos_router
from app.db.plan_repository import inicializar_planes
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.rate_limit import limiter, RateLimitExceededError, rate_limit_exceeded_handler
import app.db.mongo_client as mongo_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código de inicio de la aplicación
    print("Iniciando la aplicación...")
    try:
        # Crear índices en la base de datos al iniciar la aplicación
        init_mongo_connection()
        await create_index()
        await crear_index_tokens()
        print("Índices creados en la base de datos.")
        # Inicializar planes
        await inicializar_planes()
        print("Planes inicializados en la base de datos.")
    except Exception as e:
        print(f"Error al crear índices: {e}")
        raise

    yield # Acá se ejecuta la aplicación

    # Código de cierre de la aplicación
    print("Cerrando la aplicación...")
    await close_mongo_connection()
    print("Conexión a la base de datos cerrada.")

app = FastAPI(title="API de Recetas con Gemini", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Sondas de salud/preparación.
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Sonda de salud. Devuelve un código 200 si el proceso está en ejecución."""
    return {"status": "ok"}


@app.get("/ready", tags=["Health"])
@app.get("/api/ready", tags=["Health"])
async def readiness_check():
    """Sonda de preparación. 200 si la base de datos es accesible, 503 en caso contrario."""
    try:
        if mongo_client.client is None or mongo_client.db is None:
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready", "detail": "database not connected"},
            )
        await mongo_client.client.admin.command("ping")
        return {"status": "ready"}
    except Exception as exc: 
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "detail": str(exc)},
        )

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceededError, rate_limit_exceeded_handler)

app.include_router(receta_router, prefix="/api", tags=["Recetas"])
app.include_router(user_router, prefix="/api", tags=["Usuarios"])
app.include_router(favoritos_router, prefix="/api", tags=["Favoritos"])
app.include_router(imagenes_router, prefix="/api", tags=["Imágenes"])
app.include_router(plan_router, prefix="/api", tags=["Planes"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

# Configuración de CORS
# Permitir solicitudes desde los orígenes configurados en CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
