CREATE TYPE "OperationalStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Reservation"
  ADD COLUMN "operationStatus" "OperationalStatus",
  ADD COLUMN "totalMinor" INTEGER,
  ADD COLUMN "unitPriceMinor" INTEGER,
  ADD COLUMN "pricingUnit" TEXT,
  ADD COLUMN "serviceTitle" TEXT,
  ADD COLUMN "vehicleName" TEXT,
  ADD COLUMN "requestKey" TEXT,
  ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "Reservation_agencyId_requestKey_key" ON "Reservation"("agencyId", "requestKey");
CREATE TABLE "ReservationEvent" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorLabel" TEXT NOT NULL,
  "fromStatus" "OperationalStatus",
  "toStatus" "OperationalStatus" NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReservationEvent_reservationId_createdAt_idx" ON "ReservationEvent"("reservationId", "createdAt");
ALTER TABLE "ReservationEvent" ADD CONSTRAINT "ReservationEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
