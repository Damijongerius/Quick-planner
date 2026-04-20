#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations/sync schema
echo "Syncing database schema..."
./node_modules/.bin/prisma db push --accept-data-loss

# Start the application
echo "Starting application..."
node server.js
