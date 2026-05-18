FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY services/mcp/package.json services/mcp/package-lock.json* ./services/mcp/
COPY services/app/prisma/schema.prisma ./services/app/prisma/

WORKDIR /app/services/mcp

# Install dependencies and generate prisma client
RUN npm install
RUN mkdir -p prisma && cp ../../services/app/prisma/schema.prisma prisma/ && npx prisma generate

# Copy source code
COPY services/mcp/src ./src
COPY services/mcp/tsconfig.json ./

# Build and start
EXPOSE 3001
CMD ["npm", "run", "start"]
