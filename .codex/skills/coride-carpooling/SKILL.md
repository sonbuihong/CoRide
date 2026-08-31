---
name: coride-carpooling
description: Implement, debug, or refactor CoRide carpooling with driver-created Ride, passenger Booking, route matching, stops, seats, schedules, pickup/dropoff, booking approval, and carpool lifecycle. Excludes on-demand TripRequest ride-hailing.
---

# CoRide Carpooling

Carpooling is `Ride` + `Booking`; ride-hailing is `TripRequest`.

## Files and lifecycle

- Schema: `code/packages/database/prisma/schema.prisma`; contracts: `code/packages/shared/src/ride.schema.ts` and `booking.schema.ts`.
- APIs: `code/apps/backend/src/modules/rides/` and `modules/bookings/`; route algorithms: `route-matching.service.ts`, `ride-matching.service.ts`, `ride-route-optimizer.service.ts`.
- Mobile: `code/apps/mobile/app/ride/`, `app/booking/`, passenger my-rides, driver publish/requests.

Ride status: `SCHEDULED`, `ONGOING`, `COMPLETED`, `CANCELLED`, `FULL`. Booking: `PENDING`, `CONFIRMED`, `CANCELLED`, `REJECTED`, `EXPIRED`, `COMPLETED`. Policy: `INSTANT` or `DRIVER_APPROVAL`.

## Invariants

- Driver owns Ride route/schedule/capacity/price; passenger requests seats and optional route pickup.
- Backend validates state/time, ownership, duplicate active booking, route match, and seats.
- `seatHeld` represents holds; capacity uses conditional `updateMany` with `availableSeats >= seats` inside transaction. Preserve release on rejection/cancel/expiry/failure.
- Approval expires via the backend sweep; inspect `bookings.service.ts` and `server.ts` before timeout changes.
- Pickup uses `/arrived`, `/pickup`, `/dropoff` plus timestamps/flags.
- Realtime spans `ride:*`, `booking:*`, and authorized rooms. Preserve both clients.
- Shared User/payment/notification/review/chat/location changes must not apply TripRequest state rules here.

Test last-seat concurrency, hold rollback/release, duplicates, approval/expiry, actor authorization, pickup/dropoff order, capacity/status consistency, and emit-after-commit.
