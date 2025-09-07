#!/bin/bash

# R&D CRM Deployment Script
set -e

echo "🚀 Starting R&D CRM deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from env.example"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your production values"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=("DB_NAME" "DB_USER" "DB_PASSWORD" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=300
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        echo "✅ Services are healthy"
        break
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo "   Waiting... (${elapsed}s/${timeout}s)"
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Services failed to become healthy within ${timeout}s"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate-all

# Show status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Access information:"
echo "   Frontend: http://your-domain.com"
echo "   Backend API: http://your-domain.com/api"
echo "   Login: http://your-domain.com/login.html"
echo ""
echo "🔐 Default credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  Please change the default password after first login!"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
