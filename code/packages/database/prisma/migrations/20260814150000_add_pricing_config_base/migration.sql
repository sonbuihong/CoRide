-- PricingConfig and VehicleType were added to schema.prisma without a matching
-- migration. This additive migration restores the missing migration history
-- before the carpool pricing columns are introduced by the next migration.
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'CAR');

CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "pricePerKm" DOUBLE PRECISION NOT NULL,
    "pricePerMinute" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseDistance" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "minFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingConfig_vehicleType_key"
ON "PricingConfig"("vehicleType");
