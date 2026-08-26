ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TYPE "BookingPolicy" AS ENUM ('INSTANT', 'DRIVER_APPROVAL');

CREATE TABLE "RideSchedule" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RideSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RideStop" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RideStop_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Ride"
ADD COLUMN "bookingPolicy" "BookingPolicy" NOT NULL DEFAULT 'DRIVER_APPROVAL',
ADD COLUMN "scheduleId" TEXT;

ALTER TABLE "Booking"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "seatHeld" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pickupStopId" TEXT;

UPDATE "Booking" SET "seatHeld" = true WHERE "status" IN ('PENDING', 'CONFIRMED');

CREATE INDEX "RideSchedule_driverId_createdAt_idx" ON "RideSchedule"("driverId", "createdAt");
CREATE INDEX "Ride_scheduleId_departureTime_idx" ON "Ride"("scheduleId", "departureTime");
CREATE UNIQUE INDEX "Ride_driverId_departureTime_key" ON "Ride"("driverId", "departureTime");
CREATE UNIQUE INDEX "RideStop_rideId_order_key" ON "RideStop"("rideId", "order");
CREATE INDEX "RideStop_rideId_idx" ON "RideStop"("rideId");
CREATE INDEX "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt");
CREATE INDEX "Booking_pickupStopId_idx" ON "Booking"("pickupStopId");

ALTER TABLE "RideSchedule"
ADD CONSTRAINT "RideSchedule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Ride"
ADD CONSTRAINT "Ride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "RideSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RideStop"
ADD CONSTRAINT "RideStop_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_pickupStopId_fkey" FOREIGN KEY ("pickupStopId") REFERENCES "RideStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "PricingConfig" SET "driverPriceAdjustment" = 0.2;
ALTER TABLE "PricingConfig" ALTER COLUMN "driverPriceAdjustment" SET DEFAULT 0.2;
