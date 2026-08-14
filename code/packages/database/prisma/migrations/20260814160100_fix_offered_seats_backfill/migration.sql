-- availableSeats chỉ bị trừ khi booking CONFIRMED; PENDING chưa giữ ghế và
-- COMPLETED đã được hoàn ghế, nên chỉ cộng booking đang CONFIRMED.
UPDATE "Ride" r
SET "offeredSeats" = GREATEST(
  r."availableSeats" + COALESCE((
    SELECT SUM(b."seats")
    FROM "Booking" b
    WHERE b."rideId" = r."id" AND b."status" = 'CONFIRMED'
  ), 0),
  1
);
