# syntax=docker/dockerfile:1

# ---- Fase de construcción ----
FROM node:20-alpine AS build

WORKDIR /app

# Instala primero las dependencias para optimizar la caché de capas
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente y compilar
COPY . .

# URL de la API en tiempo de compilación (integrada en el bundle de Vite mediante import.meta.env)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Fase de ejecución ----
FROM nginx:alpine

# Copiar la configuración personalizada de Nginx para el enrutamiento de SPA, gzip y encabezados de PWA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos generados desde la etapa de compilación
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
