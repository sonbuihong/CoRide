---
name: coride-testing
description: Select, add, or run verification for CoRide backend, web, mobile, database, realtime, ride-hailing, or carpooling changes, including Jest/Supertest, Playwright, TypeScript, lint, builds, race tests, and reconnect/listener behavior.
---

# CoRide Testing

## Infrastructure

- Backend: Jest 29, ts-jest, Supertest; `code/apps/backend/jest.config.js`; tests under `src/**/*.test.ts` and `src/tests`.
- Web: Playwright config `code/apps/web/playwright.config.ts`, specs `apps/web/tests/e2e`; invoke explicitly because web has no `test` script.
- Mobile: TypeScript, Expo lint/export; no package `test` script. A legacy renderer test exists.
- `code/test-scripts/test-concurrency.js` is a non-executable carpool draft with fake token/IDs and commented main—not a valid automated test.

## Commands from `code/`

```bash
pnpm --filter backend test
pnpm --filter backend test -- --runInBand src/modules/pricing/pricing.service.test.ts
pnpm --filter @repo/mobile typecheck
pnpm --filter @repo/mobile lint
pnpm --filter @repo/mobile build
pnpm --filter web build
pnpm --filter web exec tsc --noEmit
pnpm --filter web exec playwright test
pnpm lint
pnpm build
pnpm --filter @repo/database generate
```

Real integration tests may need PostgreSQL/Redis/RabbitMQ/Goong env. Distinguish infrastructure failure from regression.

## Selection and critical cases

- Backend contract/service: focused Jest + backend build. Mobile: typecheck/lint, export and native/web smoke for platform code. Web: typecheck/build, Playwright for flows. Prisma: generate/build/migration SQL. Shared changes: build all consumers.
- Invalid Trip transition must fail without mutation; only correct passenger/assigned driver may act.
- Race Driver A/B against one `MATCHING` trip: exactly one success, one failure, one persisted driver, only winner busy.
- Assert DB change completes before correct event; mount/unmount/remount yields one callback with exact-reference cleanup.
- Disconnect/reconnect or background/resume must rejoin/refetch and restore active Trip.

Do not infer race safety from sequential tests or read-then-update code.
