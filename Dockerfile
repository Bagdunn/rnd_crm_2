# Railway deployment
FROM node:18-alpine

WORKDIR /app

# Install bash for start.sh
RUN apk add --no-cache bash

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy frontend static files to serve them
COPY frontend/ ./public/

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application with start.sh
CMD ["./start.sh"]
