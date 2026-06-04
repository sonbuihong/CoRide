-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('DRIVER', 'PASSENGER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ==============================
-- User: Tách rating theo vai trò + thêm KYC flag
-- ==============================

-- Thêm cột mới
ALTER TABLE "User" ADD COLUMN "driverRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "driverRatingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "passengerRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "passengerRatingCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "isDriverVerified" BOOLEAN NOT NULL DEFAULT false;

-- Migrate dữ liệu cũ: copy rating hiện tại vào cả 2 cột (để không mất data)
UPDATE "User" SET "driverRating" = "rating", "driverRatingCount" = "ratingCount",
                  "passengerRating" = "rating", "passengerRatingCount" = "ratingCount"
WHERE "ratingCount" > 0;

-- Xóa cột cũ
ALTER TABLE "User" DROP COLUMN "rating";
ALTER TABLE "User" DROP COLUMN "ratingCount";

-- ==============================
-- Wallet: Tách balance thành 2 nguồn tiền
-- ==============================

ALTER TABLE "Wallet" ADD COLUMN "rideBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "driverEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Migrate dữ liệu: copy balance cũ vào rideBalance (passenger)
UPDATE "Wallet" SET "rideBalance" = "balance" WHERE "balance" > 0;

ALTER TABLE "Wallet" DROP COLUMN "balance";

-- ==============================
-- Review: Thêm type (ReviewType)
-- ==============================

ALTER TABLE "Review" ADD COLUMN "type" "ReviewType";

-- Migrate reviews cũ: xác định type dựa trên reviewer có phải driver không
UPDATE "Review" r SET "type" = CASE
  WHEN r."reviewerId" = (SELECT ride."driverId" FROM "Ride" ride WHERE ride."id" = r."rideId")
  THEN 'PASSENGER'::"ReviewType"
  ELSE 'DRIVER'::"ReviewType"
END;

-- Sau khi migrate xong, set NOT NULL
ALTER TABLE "Review" ALTER COLUMN "type" SET NOT NULL;

-- ==============================
-- DriverVerification: Bảng KYC tài xế mới
-- ==============================

CREATE TABLE "DriverVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseImageUrl" TEXT NOT NULL,
    "vehicleImageUrl" TEXT NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "vehicleModel" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverVerification_userId_key" ON "DriverVerification"("userId");

-- AddForeignKey
ALTER TABLE "DriverVerification" ADD CONSTRAINT "DriverVerification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
