-- CreateEnum
CREATE TYPE "ServiceResourceType" AS ENUM ('GUIDE', 'DRIVER');

-- CreateEnum
CREATE TYPE "AssignmentResourceType" AS ENUM ('GUIDE', 'DRIVER', 'VEHICLE');

-- CreateTable
CREATE TABLE "ServiceResource" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" "ServiceResourceType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "documentNumber" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetVehicle" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "internalLabel" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationResourceAssignment" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "resourceType" "AssignmentResourceType" NOT NULL,
    "serviceResourceId" TEXT,
    "fleetVehicleId" TEXT,
    "assignedById" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationResourceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceResource_agencyId_type_isActive_idx" ON "ServiceResource"("agencyId", "type", "isActive");

-- CreateIndex
CREATE INDEX "ServiceResource_agencyId_idx" ON "ServiceResource"("agencyId");

-- CreateIndex
CREATE INDEX "ServiceResource_userId_idx" ON "ServiceResource"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FleetVehicle_agencyId_plate_key" ON "FleetVehicle"("agencyId", "plate");

-- CreateIndex
CREATE INDEX "FleetVehicle_agencyId_isActive_idx" ON "FleetVehicle"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "FleetVehicle_vehicleTypeId_idx" ON "FleetVehicle"("vehicleTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationResourceAssignment_reservationId_resourceType_key" ON "ReservationResourceAssignment"("reservationId", "resourceType");

-- CreateIndex
CREATE INDEX "ReservationResourceAssignment_serviceResourceId_serviceDate_idx" ON "ReservationResourceAssignment"("serviceResourceId", "serviceDate");

-- CreateIndex
CREATE INDEX "ReservationResourceAssignment_fleetVehicleId_serviceDate_idx" ON "ReservationResourceAssignment"("fleetVehicleId", "serviceDate");

-- CreateIndex
CREATE INDEX "ReservationResourceAssignment_agencyId_serviceDate_idx" ON "ReservationResourceAssignment"("agencyId", "serviceDate");

-- CreateIndex
CREATE INDEX "ReservationResourceAssignment_reservationId_idx" ON "ReservationResourceAssignment"("reservationId");

-- Double-Booking Prevention: Unique per service date when resource is assigned
CREATE UNIQUE INDEX "ReservationResourceAssignment_serviceResourceId_serviceDate_key" ON "ReservationResourceAssignment"("serviceResourceId", "serviceDate") WHERE "serviceResourceId" IS NOT NULL;

CREATE UNIQUE INDEX "ReservationResourceAssignment_fleetVehicleId_serviceDate_key" ON "ReservationResourceAssignment"("fleetVehicleId", "serviceDate") WHERE "fleetVehicleId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceResource" ADD CONSTRAINT "ServiceResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetVehicle" ADD CONSTRAINT "FleetVehicle_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetVehicle" ADD CONSTRAINT "FleetVehicle_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_serviceResourceId_fkey" FOREIGN KEY ("serviceResourceId") REFERENCES "ServiceResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_fleetVehicleId_fkey" FOREIGN KEY ("fleetVehicleId") REFERENCES "FleetVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationResourceAssignment" ADD CONSTRAINT "ReservationResourceAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
