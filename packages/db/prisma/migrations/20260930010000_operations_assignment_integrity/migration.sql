-- Add shape integrity CHECK constraint to ReservationResourceAssignment
ALTER TABLE "ReservationResourceAssignment"
ADD CONSTRAINT "ReservationResourceAssignment_valid_shape_check"
CHECK (
  (
    "resourceType" IN ('GUIDE', 'DRIVER')
    AND "serviceResourceId" IS NOT NULL
    AND "fleetVehicleId" IS NULL
  )
  OR
  (
    "resourceType" = 'VEHICLE'
    AND "serviceResourceId" IS NULL
    AND "fleetVehicleId" IS NOT NULL
  )
);
