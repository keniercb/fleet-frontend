# ============================================
# Dockerfile — Fleet Management Frontend
# Multi-stage build: Node build → Nginx serve
# ============================================

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

LABEL maintainer="Fleet Management Team"
LABEL description="Build stage for Fleet Management Frontend (React + Vite)"

WORKDIR /app

# Copiar package.json y lockfile para cache de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (solo producción del lockfile)
RUN npm ci

# Copiar el resto del codigo fuente
COPY . .

# Variables de entorno de build (defaults — sobreescribibles con --build-arg)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build de produccion
RUN npm run build

# ---- Stage 2: Nginx ----
FROM nginx:1.27-alpine AS production

LABEL maintainer="Fleet Management Team"
LABEL description="Production Nginx server for Fleet Management Frontend (SPA)"

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar archivos estaticos del builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuracion de Nginx (SPA routing + proxy API + compresion + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Healthcheck: verificar que Nginx responde 200
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
