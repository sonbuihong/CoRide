---
name: coride-realtime
description: Implement, debug, or audit CoRide Socket.IO, Redis adapter/emitter, RabbitMQ notification delivery, rooms, driver location, reconnect behavior, event naming, or duplicate/missing realtime updates across backend, web, and mobile.
---

# CoRide Realtime

## Architecture

`code/apps/backend/src/socket/socket.server.ts` initializes authenticated Socket.IO with `@socket.io/redis-adapter`; sockets join `user:<id>` and `<id>`. Rooms/handlers live in `modules/trips/trips.socket.ts` and `socket.legacy.ts`.

`code/apps/notification-service/src/server.ts` consumes RabbitMQ messages from `backend/src/shared/lib/notification-emitter.ts`, persists them, then uses `@socket.io/redis-emitter`. Constants/payloads are in `code/packages/shared/src/socket.events.ts`; client singletons/hooks are under mobile `src/services/socket.service.ts` and web `src/lib/socket-client.ts`.

## Actual event families

- Ride-hailing: `trip:created`, `trip:updated`, `trip:deleted`, `trip:new_request`, `trip:request_expired`, `trip:matched`, `trip:no_driver`, `trip:status_update`.
- Room/carpool trip: `trip:join_room`, `trip:leave_room`, `trip:status_changed`, `trip:seat_updated`, participant/join-request events.
- Location: client `driver:update_location`; room `trip:location_updated`; legacy alias `driver:location`.
- Carpooling `ride:*`/`booking:*`; notification `notification:new`/`notification:created`; chat `chat:*`.

Current naming is inconsistent (`updated` vs `status_update`; cancellation emits `deleted` although `cancelled` exists). Trace producer and all consumers before consolidating; do not invent another alias.

## Rules

1. Commit business state, then emit. Socket events never prove persistence.
2. Authenticate room membership and producer role. Only the cached trip `DRIVER` role publishes trip location.
3. Clean up with the identical handler reference: `on(event, handler)` → `off(event, handler)`.
4. On reconnect/resume, rejoin the room and refetch Trip/Ride/Booking via API.
5. Separate validated/throttled high-frequency location from lifecycle updates; stop watchers and avoid whole-trip invalidation at GPS frequency.
6. Verify user room form before edits because current producers use both prefixed and raw IDs.

For duplicates inspect mount/unmount/remount, callback identity, singleton connect calls, and aliases. For missing updates trace DB → event/room → Redis → rejoin → listener → API refetch.
