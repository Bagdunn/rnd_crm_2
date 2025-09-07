# Multi-stage build for Railway deployment
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

FROM nginx:alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/ ./
COPY frontend/nginx.conf /etc/nginx/nginx.conf

FROM node:18-alpine AS runtime

# Install Docker and Docker Compose
RUN apk add --no-cache docker docker-compose

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend ./backend

# Copy frontend
COPY --from=frontend-builder /usr/share/nginx/html ./frontend

# Copy configuration files
COPY docker-compose.yml ./
COPY docker-compose.prod.yml ./

# Copy scripts
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["./start.sh"]
