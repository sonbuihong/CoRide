# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package management files
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build shared packages
RUN cd packages/shared && npm run build

# Build web
ENV NEXT_PUBLIC_API_URL=http://localhost:5001/api
RUN cd apps/web && npm run build

# Runtime Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

EXPOSE 3000
CMD ["sh", "-c", "cd apps/web && npm start"]

