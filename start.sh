#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
sleep 10

# Run migrations
echo "Running database migrations..."
cd backend && node migrations/run-all-migrations.js

# Run seeds
echo "Running database seeds..."
node seeds/run-seeds.js

# Start the application
echo "Starting application..."
cd .. && docker-compose up -d

# Keep container running
tail -f /dev/null
