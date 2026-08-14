-- Store the driver's complete route so passengers can be matched along the way.
ALTER TABLE "Ride" ADD COLUMN "routePolyline" TEXT;
