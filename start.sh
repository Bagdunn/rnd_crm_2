#!/bin/bash

echo "🚀 Starting R&D CRM application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
node backend/migrations/run-all-migrations.js

# Run seeds
echo "🌱 Running database seeds..."
node backend/seeds/run-seeds.js

echo "✅ Database setup completed!"

# Start the application
echo "🌐 Starting web server..."
cd backend && node server.js
