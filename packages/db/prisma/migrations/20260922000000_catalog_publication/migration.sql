-- AlterTable
ALTER TABLE "Tour" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VehicleType" ADD COLUMN     "agencyId" TEXT;

-- CreateIndex
CREATE INDEX "VehicleType_agencyId_idx" ON "VehicleType"("agencyId");

-- AddForeignKey
ALTER TABLE "VehicleType" ADD CONSTRAINT "VehicleType_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
