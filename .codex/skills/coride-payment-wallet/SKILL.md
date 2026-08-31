---
name: coride-payment-wallet
description: Implement, audit, or debug CoRide Wallet, Transaction ledger, trip/booking payment status, QR payment simulator, refunds, balances, driver earnings, or payment-driven TripRequest completion.
---

# CoRide Payment and Wallet

Files: Prisma schema; `code/apps/backend/src/modules/payments/`; `code/packages/shared/src/payment.schema.ts`; mobile `src/services/payment.service.ts` and `app/profile/wallet.tsx`; web `src/components/booking/payment-simulator-dialog.tsx`.

One Wallet/User has `rideBalance` and `driverEarnings`. Transaction types: `DEPOSIT`, `WITHDRAWAL`, `PAYMENT`, `RECEIVE_PAYMENT`, `REFUND`; statuses: `PENDING`, `SUCCESS`, `FAILED`. Payment: `UNPAID`, `PAID`, `REFUNDED`; methods: `CASH`, `QR`, `ZALOPAY`, `WALLET`.

Current user payment is a simulator: GET `/api/payments/simulator/qr/:id` creates a VietQR URL; POST `/simulator/confirm` creates pending ledger, responds, then after 3 seconds succeeds. For TripRequest it changes `WAITING_PAYMENT` to `COMPLETED`, sets `PAID`/`QR`, and emits `trip:updated`. Do not call this verified bank/ZaloPay integration.

## Rules and risks

- Authorize from persisted relations; never trust frontend owner, price, payment status, or completion.
- Make balance + ledger atomic, non-negative, and idempotent via external/domain key. Link correct Booking or TripRequest.
- Complete Trip only from `WAITING_PAYMENT`; repeated/concurrent confirmation must not duplicate charges.
- Emit only after commit; failures must leave `FAILED` without paid domain state.
- Current Float money has rounding risk; production changes should use minor units/Decimal.
- Risk: concurrent simulator confirmations can create duplicates; socket emit occurs inside Prisma transaction callback; shared wallet response expects `balance` while model exposes two balances.

Test ownership/state, concurrency/idempotency, rollback, ledger/domain consistency, insufficient funds, refund, rounding, and event-after-commit.
