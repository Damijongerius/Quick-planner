#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations/sync schema
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Install dependencies to keep the node_modules volume up to date
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Start the application in dev mode
echo "Starting application in development mode..."
npm run dev
