-- Create partial unique index to prevent duplicate bookings
CREATE UNIQUE INDEX "Booking_rideId_passengerId_partial_key" ON "Booking"("rideId", "passengerId") WHERE status IN ('PENDING', 'CONFIRMED');
