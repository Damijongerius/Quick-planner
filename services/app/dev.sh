#!/bin/sh
set -e

# Wait for database to be ready using an instant TCP probe
echo "Waiting for database to be ready..."
node -e "
const net = require('net');
const client = new net.Socket();
const check = () => {
  client.connect(5432, 'db', () => {
    client.end();
    process.exit(0);
  });
};
client.on('error', () => {
  setTimeout(check, 500);
});
check();
"

# Run migrations/sync schema
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Install dependencies only if not already present in the mounted volume
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
else
  echo "Dependencies already installed. Skipping slow npm install step!"
fi

# Start the application in dev mode
echo "Starting application in development mode..."
npm run dev
