-- Additive migration for payment session safety (P1.2)
-- Rollback reasoning: Nullable column can be safely dropped without data loss to existing fields.
-- Non-destructive: Existing historical reservations will have paymentFormToken = NULL.
ALTER TABLE "Reservation" ADD COLUMN "paymentFormToken" TEXT;
