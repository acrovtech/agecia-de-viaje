-- Additive migration for distributed payment session coordination and lifecycle safety (P1.3)
-- Rollback reasoning: All newly added columns are nullable. They can be safely dropped without affecting core reservation or financial data.
-- Non-destructive: Existing historical reservations maintain NULL for all newly added session coordination fields.

ALTER TABLE "Reservation" ADD COLUMN "paymentFormTokenCreatedAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN "paymentSessionOwner" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "paymentSessionExpiresAt" TIMESTAMP(3);
ALTER TABLE "Reservation" ADD COLUMN "paymentSessionStatus" TEXT;
