ALTER TABLE "TripRequest"
ADD COLUMN "arrivedAt" TIMESTAMP(3);

-- Ride-Hailing reviews reuse Review while keeping Carpooling Ride compatible.
ALTER TABLE "Review" ALTER COLUMN "rideId" DROP NOT NULL;
ALTER TABLE "Review" ADD COLUMN "tripRequestId" TEXT;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_tripRequestId_fkey"
FOREIGN KEY ("tripRequestId") REFERENCES "TripRequest"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Review_rideId_reviewerId_revieweeId_key"
ON "Review"("rideId", "reviewerId", "revieweeId");

CREATE UNIQUE INDEX "Review_tripRequestId_reviewerId_revieweeId_key"
ON "Review"("tripRequestId", "reviewerId", "revieweeId");

-- Final database guards for concurrent duplicate active requests/assignments.
CREATE UNIQUE INDEX "TripRequest_one_active_passenger_key"
ON "TripRequest"("passengerId")
WHERE "status" IN ('PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'WAITING_PAYMENT');

CREATE UNIQUE INDEX "TripRequest_one_active_driver_key"
ON "TripRequest"("driverId")
WHERE "driverId" IS NOT NULL
  AND "status" IN ('ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'WAITING_PAYMENT');
