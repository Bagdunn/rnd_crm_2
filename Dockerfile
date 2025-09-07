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

# Copy start.sh from root
COPY start.sh ./

# Make start.sh executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

# Start with start.sh
CMD ["./start.sh"]
