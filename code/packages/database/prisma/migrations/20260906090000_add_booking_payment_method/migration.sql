-- Keep historical methods unknown; never label older payments as QR without evidence.
ALTER TABLE "Booking" ADD COLUMN "paymentMethod" "PaymentMethod";
