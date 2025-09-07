# Railway deployment - backend only
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy frontend static files
COPY frontend/ ./public/

# Copy start.js from root
COPY start.js ./

# Expose port
EXPOSE 3000

# Use start.js as entrypoint
CMD ["node", "start.js"]
