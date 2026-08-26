-- Complete schema objects that existed in schema.prisma but were missing from
-- migration history. This migration is additive and preserves legacy KYC data.

CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QR', 'ZALOPAY', 'WALLET');
CREATE TYPE "TripStatus" AS ENUM ('PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'WAITING_PAYMENT', 'COMPLETED', 'CANCELLED', 'NO_DRIVER');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'FULL';

ALTER TABLE "Booking"
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "dropoffAddress" TEXT,
ADD COLUMN "dropoffLat" DOUBLE PRECISION,
ADD COLUMN "dropoffLng" DOUBLE PRECISION,
ADD COLUMN "isDroppedOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isPickedUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passengerLat" DOUBLE PRECISION,
ADD COLUMN "passengerLng" DOUBLE PRECISION,
ADD COLUMN "pickupAddress" TEXT;

-- Preserve old KYC URLs by copying them into the newer four-sided document model.
ALTER TABLE "DriverVerification"
ADD COLUMN "licenseBackImageUrl" TEXT,
ADD COLUMN "licenseFrontImageUrl" TEXT,
ADD COLUMN "registrationBackImageUrl" TEXT,
ADD COLUMN "registrationFrontImageUrl" TEXT,
ADD COLUMN "vehicleType" TEXT NOT NULL DEFAULT 'BIKE';

UPDATE "DriverVerification"
SET "licenseFrontImageUrl" = "licenseImageUrl",
    "licenseBackImageUrl" = "licenseImageUrl",
    "registrationFrontImageUrl" = "vehicleImageUrl",
    "registrationBackImageUrl" = "vehicleImageUrl";

ALTER TABLE "DriverVerification"
ALTER COLUMN "licenseBackImageUrl" SET NOT NULL,
ALTER COLUMN "licenseFrontImageUrl" SET NOT NULL,
ALTER COLUMN "registrationBackImageUrl" SET NOT NULL,
ALTER COLUMN "registrationFrontImageUrl" SET NOT NULL;

ALTER TABLE "Ride"
ADD COLUMN "allowLuggage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowPets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowSmoking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "vehicleId" TEXT;

ALTER TABLE "Transaction" ADD COLUMN "tripRequestId" TEXT;

CREATE TABLE "TripRequest" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "originAddress" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destAddress" TEXT NOT NULL,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'BIKE',
    "estimatedDistance" DOUBLE PRECISION NOT NULL,
    "estimatedDuration" DOUBLE PRECISION NOT NULL,
    "estimatedPrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod",
    "status" "TripStatus" NOT NULL DEFAULT 'PENDING',
    "matchAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 10,
    "matchRadius" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "matchedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL DEFAULT 'BIKE',
    "color" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OTP" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OTP_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "rideId" TEXT,
    "tripRequestId" TEXT,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TripRequest_passengerId_status_idx" ON "TripRequest"("passengerId", "status");
CREATE INDEX "TripRequest_driverId_status_idx" ON "TripRequest"("driverId", "status");
CREATE INDEX "TripRequest_status_createdAt_idx" ON "TripRequest"("status", "createdAt");
CREATE INDEX "TripRequest_originLat_originLng_idx" ON "TripRequest"("originLat", "originLng");
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
CREATE INDEX "OTP_email_idx" ON "OTP"("email");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tripRequestId_fkey"
FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ride" ADD CONSTRAINT "Ride_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_passengerId_fkey"
FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TripRequest" ADD CONSTRAINT "TripRequest_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey"
FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_rideId_fkey"
FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_tripRequestId_fkey"
FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
