---
name: coride-ride-hailing
description: Audit, implement, debug, or refactor CoRide on-demand Ride-Hailing involving TripRequest, passenger/driver flows, matching, dispatch, pickup, execution, cancellation, payment handoff, active trips, or driver assignment. Do not use Ride/Booking carpooling rules as Trip rules.
---

# CoRide Ride-Hailing

`TripRequest` is on-demand ride-hailing. `Ride` plus `Booking` is carpooling. Never use them interchangeably.

## Inspect first

- Schema: `code/packages/database/prisma/schema.prisma`; contract: `code/packages/shared/src/trip.schema.ts`
- REST: `code/apps/backend/src/modules/trips/`; matching: `code/apps/backend/src/modules/matching/matching.service.ts`
- Driver GEO/presence: `code/apps/backend/src/shared/lib/redis.ts`; socket accept/reject: `code/apps/backend/src/socket/socket.legacy.ts`
- Passenger: `code/apps/mobile/app/(passenger-tabs)/ride-hailing.tsx`, `src/services/trip.service.ts`, `src/hooks/useActiveRide.ts`
- Driver: `code/apps/mobile/app/(driver-tabs)/index.tsx`, `app/driver/active-trip.tsx`; shared active UI: `src/features/trip-flow/`

Read [references/state-machine.md](references/state-machine.md) for status, authorization, matching, cancellation, payment, or UI-flow work.

## Invariants

- `POST /api/trips` prices server-side, creates `PENDING`, then starts matching asynchronously.
- Matching uses Redis GEO within `matchRadius` (default 5 km), filters online/not-busy/not-passenger drivers, offers nearest-first for 10 seconds each, and caps at `maxAttempts` (default 10).
- Only verified drivers go online/accept. Select the winner atomically with a conditional database write on `status=MATCHING`; frontend or a prior read cannot decide it.
- Passenger active: `PENDING`, `MATCHING`, `ACCEPTED`, `ARRIVING`, `IN_PROGRESS`, `WAITING_PAYMENT`; driver active excludes pre-assignment states.
- Check passenger active trip before creation and driver active/busy state before assignment. Redis supplements database enforcement.
- Passenger or assigned driver may cancel only before `IN_PROGRESS`; only assigned driver advances lifecycle; passenger confirms payment.
- On reconnect/resume, refetch `/api/trips/active` or `/api/trips/active-driver`; sockets are not durable truth.

## Known source risks

- `MatchingService.handleDriverAccept` says atomic but does `findUnique` then unconditional `update` by id: two concurrent accepts may both succeed. Acceptance work must add/test a conditional DB write or transaction.
- `TripsService.acceptTrip` is a second non-atomic implementation; mounted controller currently uses MatchingService. Do not route new callers to it.
- Status updates emit `trip:updated`; matching emits `trip:status_update`/`trip:matched`; clients subscribe to different subsets.
- Cancellation emits `trip:deleted` although `trip:cancelled` exists. Preserve compatibility deliberately; do not add another alias.

## Verify

Test transitions, ownership, active-trip guards, KYC, exactly-one-winner concurrency, DB-before-event ordering, reconnect recovery, and matching mobile/web listeners. Use `$coride-testing`.
