# ReceYa

ReceYa es una aplicación para generar recetas a partir de ingredientes. Tiene backend en FastAPI, frontend en React/Vite, autenticación, planes de uso, recetas favoritas, recomendaciones e imágenes generadas con Cloudflare Workers AI.

## Estructura

| Carpeta | Descripción |
| --- | --- |
| `backend/` | API en FastAPI, MongoDB, autenticación, planes, generación de recetas e imágenes. |
| `frontend/` | Interfaz en React + Vite para usar la aplicación desde el navegador. |

## Requisitos

- Python 3.12+
- Node.js 20+
- MongoDB local o por Docker
- API key de Gemini para texto
- Credenciales de Cloudflare Workers AI para imágenes

## Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env_example .env
```

Completá `backend/.env` con tus credenciales reales:

```env
GEMINI_API_KEY=tu_clave_de_gemini
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
IMAGE_GENERATION_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=tu_account_id
CLOUDFLARE_API_TOKEN=tu_token
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=una_clave_segura
```

Iniciar API:

```bash
uvicorn app.main:app --reload
```

URL esperada:

```txt
http://localhost:8000
```

## Frontend

```bash
cd frontend
npm ci
cp .env_example .env
npm run dev
```

`frontend/.env` debe apuntar al backend:

```env
VITE_API_URL=http://localhost:8000/api
```

URL esperada:

```txt
http://localhost:5173
```

## Verificación

Backend:

```bash
cd backend
./venv/bin/python -m pytest
./venv/bin/python -m compileall app tests
./venv/bin/pip check
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm audit --audit-level=low
```