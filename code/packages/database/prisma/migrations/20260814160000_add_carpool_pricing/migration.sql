ALTER TABLE "Ride"
ADD COLUMN "offeredSeats" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "tollCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Dữ liệu cũ: khôi phục gần đúng số ghế mở bán từ ghế còn lại và booking đã giữ chỗ.
UPDATE "Ride" r
SET "offeredSeats" = GREATEST(
  r."availableSeats" + COALESCE((
    SELECT SUM(b."seats")
    FROM "Booking" b
    WHERE b."rideId" = r."id"
      AND b."status" IN ('PENDING', 'CONFIRMED')
  ), 0),
  1
);

ALTER TABLE "Booking"
ADD COLUMN "sharedDistanceKm" DOUBLE PRECISION,
ADD COLUMN "detourKm" DOUBLE PRECISION,
ADD COLUMN "priceBreakdown" JSONB;

ALTER TABLE "PricingConfig"
ADD COLUMN "fuelPrice" DOUBLE PRECISION NOT NULL DEFAULT 22119,
ADD COLUMN "fuelConsumption" DOUBLE PRECISION NOT NULL DEFAULT 6.5,
ADD COLUMN "vehicleOverheadRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN "minimumDriverShare" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
ADD COLUMN "driverPriceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
ADD COLUMN "roundingUnit" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN "maxDetourKm" DOUBLE PRECISION NOT NULL DEFAULT 5,
ADD COLUMN "maxDetourRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.1;
