# ── Etapa 1: Construcción Vite ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package descriptor
COPY package.json ./

# Ejecutar npm install para instalar dependencias y generar lock file en el contenedor
RUN npm install --silent

# Copiar el código fuente y compilar
COPY . ./
RUN npm run build

# ── Etapa 2: Servidor Nginx Minimalista ───────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Eliminar la configuración por defecto de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Inyectar configuración optimizada para SPA + SSE
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar el bundle estático generado por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
