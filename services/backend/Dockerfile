FROM node:22-alpine

WORKDIR /app

# Install dependencies needed for Prisma/Native builds
RUN apk add --no-cache openssl libc6-compat

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy database schema and generate Prisma client
COPY prisma ./prisma
COPY prisma.config.js ./
RUN npx prisma generate

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build TS
RUN npm run build

EXPOSE 3000

# Run prisma db push and start the app
CMD ["sh", "-c", "npx prisma db push && npm run start"]
