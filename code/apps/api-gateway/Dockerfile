# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package management files
COPY package.json turbo.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api-gateway ./apps/api-gateway

# Build api-gateway
RUN cd apps/api-gateway && npm run build

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/package.json

EXPOSE 5001
CMD ["node", "apps/api-gateway/dist/server.js"]
