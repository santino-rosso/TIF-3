# syntax=docker/dockerfile:1
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Instalar curl para HEALTHCHECK
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no root
RUN groupadd --system app \
    && useradd --system --gid app --create-home appuser

# Primero copio los requisitos
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY app ./app

# Garantizar la propiedad para usuarios que no sean root.
RUN chown -R appuser:app /app

USER appuser

EXPOSE 8000

# Liveness probe — lightweight, does not require DB connectivity.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Producción: uvicorn con un único worker por defecto.
# Kubernetes gestiona el escalado horizontal mediante réplicas; aumenta el número de workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
