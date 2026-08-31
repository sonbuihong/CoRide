---
name: coride-architecture
description: Audit, implement, debug, or refactor cross-cutting CoRide architecture, backend APIs, services, middleware, gateway routing, shared packages, or changes spanning multiple apps. Use for repository-wide work; route domain-specific work to the narrower CoRide skill.
---

# CoRide Architecture

Work from `code/`; current source outranks README/design reports.

## Repository map

- `code/apps/backend/src/server.ts` starts Express/Socket.IO; `app.ts` mounts the active API routers.
- Backend features normally use router/controller/service folders under `code/apps/backend/src/modules/`. Older parallel `src/controllers` and `src/routes` exist; trace `app.ts` before editing.
- `code/apps/api-gateway/src/server.ts` proxies general `/api` to backend and `/api/notifications` to notification-service.
- `code/apps/notification-service/src/server.ts` consumes RabbitMQ, persists notifications, and publishes via the Socket.IO Redis emitter.
- `code/apps/web` is Next.js 14; `code/apps/mobile` is Expo Router for native and React Native Web.
- `code/packages/database/prisma/schema.prisma` is the PostgreSQL source; `packages/shared/src` owns Zod contracts and socket events; `design-tokens` and `tailwind-config` own styling primitives.
- `code/docker-compose.yml` defines PostgreSQL 15, Redis 7, RabbitMQ, backend, notification-service, and gateway.

## Rules

1. Trace mounted routes and imports before changing similarly named legacy files; reuse existing modules and clients.
2. Backend/database owns identity, assignment, seats, price, lifecycle, payment, and KYC. Never trust sensitive frontend fields.
3. Preserve contracts across web, Expo native/web, services, and carpooling. Put shared transport contracts in `@repo/shared`.
4. Emit realtime/notification effects only after database success.
5. Redis is for socket fan-out, presence/location, rate limits, OTP and refresh state; RabbitMQ carries notification work; PostgreSQL is durable business truth.

## Dependency direction

- Apps may import shared/database/design packages; packages must not import app code.
- Controllers parse HTTP/respond; services decide domain/persist; routers compose middleware/controllers.
- Gateway proxies and notification-service delivers notifications; neither duplicates Trip/Ride business logic.

## Commands

From `code/`:

```bash
pnpm dev
pnpm dev:mobile
pnpm lint
pnpm test
pnpm build
pnpm --filter backend test
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/database generate
pnpm --filter backend migrate
docker compose up --build
```

Use `db:push` only for deliberate local synchronization, not instead of reviewed migrations. Run the narrow package checks plus builds when routing, schema, exports, or cross-package contracts change.
