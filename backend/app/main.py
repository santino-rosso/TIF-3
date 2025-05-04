from fastapi import FastAPI
from app.routes.receta_routes import router as receta_router

app = FastAPI(title="API de Recetas con Gemini")

app.include_router(receta_router, prefix="/api")
