-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "addressDetailLevel" TEXT,
ADD COLUMN     "destAddressType" TEXT,
ADD COLUMN     "destDistrict" TEXT,
ADD COLUMN     "destHouseNumber" TEXT,
ADD COLUMN     "destProvince" TEXT,
ADD COLUMN     "destStreet" TEXT,
ADD COLUMN     "destWard" TEXT,
ADD COLUMN     "originAddressType" TEXT,
ADD COLUMN     "originDistrict" TEXT,
ADD COLUMN     "originHouseNumber" TEXT,
ADD COLUMN     "originProvince" TEXT,
ADD COLUMN     "originStreet" TEXT,
ADD COLUMN     "originWard" TEXT;

-- CreateTable
CREATE TABLE "ProvinceMapping" (
    "id" TEXT NOT NULL,
    "oldProvince" TEXT NOT NULL,
    "newProvince" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvinceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProvinceMapping_isActive_idx" ON "ProvinceMapping"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProvinceMapping_oldProvince_effectiveDate_key" ON "ProvinceMapping"("oldProvince", "effectiveDate");

-- CreateIndex
CREATE INDEX "Ride_originProvince_destProvince_idx" ON "Ride"("originProvince", "destProvince");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
