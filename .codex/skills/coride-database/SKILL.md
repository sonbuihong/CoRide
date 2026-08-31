---
name: coride-database
description: Design, review, migrate, query, or debug CoRide PostgreSQL/Prisma models, relations, constraints, indexes, transactions, generated client, or concurrency-sensitive persistence.
---

# CoRide Database

Schema: `code/packages/database/prisma/schema.prisma`; migrations: `prisma/migrations`; generated client: `packages/database/generated/client`; singleton/extension: `packages/database/src/index.ts`. Docker uses PostgreSQL 15.

## Domain map and rules

- Identity/KYC: User, DriverVerification, Vehicle, RefreshToken, OTP.
- Carpooling: Ride, RideSchedule, RideStop, Booking, Message, Review.
- Ride-hailing: TripRequest. Money: one Wallet/User and Transaction linked to Booking or TripRequest.
- Supporting: Notification, Location, PricingConfig, Report, ProvinceMapping.

Inspect schema plus migration SQL; `20260705000000_booking_partial_unique` includes DB behavior not shown as a normal Prisma attribute. Important constraints include unique email/wallet/plate/place, `(driverId, departureTime)`, `(rideId, order)`, and active lookup indexes.

Audit existing data, constraints, queries and migrations before changes. Prefer non-destructive reviewed migrations. Generate with `pnpm --filter @repo/database generate`; deploy with `pnpm --filter backend migrate`; use `db:push` only deliberately for local sync.

Use `extendedPrisma` from `@repo/database`. Transactionally update related money/seat/state rows and emit only after commit. Race-sensitive logic needs conditional writes, uniqueness, or suitable isolation—not `findUnique` then `update`. Preserve both TripRequest and Ride/Booking relations when changing shared models/enums.

Verify SQL locks/backfills/nullability/indexes, generate/build, constraint failures, rollback, concurrency, and representative existing rows.
