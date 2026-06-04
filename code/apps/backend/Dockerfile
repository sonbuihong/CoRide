# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build shared packages
RUN cd packages/shared && npm run build

# Build backend
RUN cd apps/backend && npm run build

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy built app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

EXPOSE 5001
CMD ["node", "apps/backend/dist/server.js"]

