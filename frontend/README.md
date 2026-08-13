# ReceYa Frontend

ReceYa is a recipe generation app with authentication, recipe generation through the backend AI pipeline, favorites, recommendations, subscription plans, generated images, and a cooking mode with voice/timer support.

This folder contains the React + Vite frontend. The backend lives in `../backend` and must be running for the app to work.

## Quick start

### 1. Start the backend

From the repository root:

```bash
cd backend
cp .env_example .env
```

Fill `.env` with real values:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
IMAGE_GENERATION_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=your_jwt_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173
```

Install and run:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Expected backend URL:

```text
http://localhost:8000
```

### 2. Start the frontend

From this folder:

```bash
npm ci
cp .env_example .env
npm run dev
```

The default frontend environment points to the local backend:

```env
VITE_API_URL=http://localhost:8000/api
```

Expected frontend URL:

```text
http://localhost:5173
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite in development mode. |
| `npm run build` | Build the production bundle and PWA assets. |
| `npm run lint` | Run ESLint checks. |
| `npm run preview` | Preview the production build locally. |

## Frontend routes

| Route | Page | Access |
| --- | --- | --- |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/` | Recipe form / home | Private |
| `/resultados` | Generated recipe results | Private |
| `/favoritos` | Favorite recipes | Private |
| `/perfil` | Account settings | Private |
| `/recomendaciones` | Recommended recipes | Private |
| `/planes` | Subscription plans | Private |

Private routes require an access token. The frontend stores the access token and refresh token in `localStorage`.

## Backend API used by the frontend

The frontend reads its API base URL from `VITE_API_URL`:

```text
http://localhost:8000/api
```

The base URL is defined in:

```text
src/utils/apiConfig.js
```

Main endpoints consumed by the frontend:

| Endpoint | Used for |
| --- | --- |
| `POST /login` | User login |
| `POST /register` | User registration |
| `POST /refresh` | Access token refresh |
| `POST /logout` | Refresh token invalidation |
| `GET /read` | Current user profile |
| `PUT /update` | Password update |
| `DELETE /delete` | Account deletion |
| `POST /validar-ingredientes` | Ingredient validation |
| `POST /generar-receta` | Recipe generation |
| `GET /recetas-recomendadas` | Recommended recipes |
| `GET /favoritos` | Favorite recipes |
| `POST /favoritos/:id` | Add favorite |
| `DELETE /favoritos/:id` | Remove favorite |
| `GET /planes` | Available plans |
| `GET /obtener-plan` | Current plan status |
| `POST /actualizar-plan/:tipo` | Change plan |
| `GET /imagenes/:id` | Generated recipe images |

## Verification checklist

Run these before handing off frontend changes:

```bash
npm run lint
npm run build
npm audit --audit-level=low
```

Current expected result:

- ESLint: 0 errors, 0 warnings.
- Production build: passes.
- npm audit: 0 vulnerabilities.

## Notes

- The app uses `vite-plugin-pwa`; production builds generate the service worker and manifest assets.
- The frontend assumes the backend CORS configuration allows `http://localhost:5173` for development and `http://localhost:4173` for preview.
- No automated test script exists yet. Add one before treating the project as production-ready.
