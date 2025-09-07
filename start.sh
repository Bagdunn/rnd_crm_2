#!/bin/bash

echo "🚀 Starting R&D CRM application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
node migrations/run-all-migrations.js

# Run seeds
echo "🌱 Running database seeds..."
node seeds/run-seeds.js

echo "✅ Database setup completed!"

# Start the application
echo "🌐 Starting web server..."
node server.js
