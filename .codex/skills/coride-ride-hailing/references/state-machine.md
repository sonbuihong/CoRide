# Ride-Hailing State Machine

Source: Prisma `TripStatus`, `trips.service.ts`, MatchingService, and PaymentsController.

```text
PENDING --start matching--> MATCHING
MATCHING --verified driver accepts--> ACCEPTED
MATCHING --no eligible driver/exhausted--> NO_DRIVER
ACCEPTED --assigned driver--> ARRIVING
ARRIVING --assigned driver--> IN_PROGRESS
IN_PROGRESS --assigned driver--> WAITING_PAYMENT
WAITING_PAYMENT --passenger simulator payment succeeds--> COMPLETED
PENDING|MATCHING|ACCEPTED|ARRIVING --passenger or assigned driver--> CANCELLED
```

Terminal/history states: `COMPLETED`, `CANCELLED`, `NO_DRIVER`.

`driverTripStatusSchema` permits only `ARRIVING`, `IN_PROGRESS`, `WAITING_PAYMENT`; the driver status endpoint cannot set `COMPLETED`. Simulator payment sets `PAID`/`QR` and completes the trip.

Passenger flow: select pickup/destination/vehicle → request → matching → driver assigned/arriving → in progress → waiting payment → payment/completed, with cancellation/no-driver branches.

Driver flow: verified KYC → online/location in Redis → `trip:new_request` → accept/reject → arriving → in progress → waiting payment. Completion is currently passenger-payment driven.

After transitions, inspect REST response and emitted event. Do not persist optimistic local status before backend confirmation.
