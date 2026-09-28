-- Migration: 20260928020000_strict_multitenancy_constraints
-- Strict Multi-Tenancy & Tenant-Scoped Data Constraints (P2.2)
-- Purpose:
-- 1. Safely backfill deterministic tenant ownership for legacy NULL rows using verified relationships.
-- 2. Validate zero NULL agencyId rows remain before altering schema (fail-closed check).
-- 3. Replace global uniqueness with tenant-scoped composite uniqueness for Tour, Transfer, Coupon, Category, Blog, and VehicleType.
-- 4. Enforce NOT NULL on agencyId for all tenant-required models.
-- Non-destructive: No tables dropped, no data deleted. Reversible at schema/index level.

-- ============================================================================
-- STEP 1: DETERMINISTIC OWNERSHIP BACKFILL
-- ============================================================================

-- Backfill Reservation from linked Tour
UPDATE "Reservation" r
SET "agencyId" = t."agencyId"
FROM "Tour" t
WHERE r."tourId" = t."id" AND r."agencyId" IS NULL AND t."agencyId" IS NOT NULL;

-- Backfill Reservation from linked Transfer
UPDATE "Reservation" r
SET "agencyId" = tr."agencyId"
FROM "Transfer" tr
WHERE r."transferId" = tr."id" AND r."agencyId" IS NULL AND tr."agencyId" IS NOT NULL;

-- Backfill Reservation from linked Coupon
UPDATE "Reservation" r
SET "agencyId" = c."agencyId"
FROM "Coupon" c
WHERE r."couponId" = c."id" AND r."agencyId" IS NULL AND c."agencyId" IS NOT NULL;

-- Backfill any remaining historical Reservation with audited Inca Bound agency
UPDATE "Reservation"
SET "agencyId" = 'cmu4tl0a40000ibb9fem9ajvr'
WHERE "agencyId" IS NULL
  AND EXISTS (SELECT 1 FROM "Agency" WHERE "id" = 'cmu4tl0a40000ibb9fem9ajvr');

-- Backfill VehicleType from TransferVehiclePrice -> Transfer relationship
UPDATE "VehicleType" v
SET "agencyId" = tr."agencyId"
FROM "TransferVehiclePrice" tvp
JOIN "Transfer" tr ON tvp."transferId" = tr."id"
WHERE tvp."vehicleId" = v."id" AND v."agencyId" IS NULL AND tr."agencyId" IS NOT NULL;

-- Backfill any remaining historical VehicleType with audited Inca Bound agency
UPDATE "VehicleType"
SET "agencyId" = 'cmu4tl0a40000ibb9fem9ajvr'
WHERE "agencyId" IS NULL
  AND EXISTS (SELECT 1 FROM "Agency" WHERE "id" = 'cmu4tl0a40000ibb9fem9ajvr');

-- Backfill Blog with audited Inca Bound agency
UPDATE "Blog"
SET "agencyId" = 'cmu4tl0a40000ibb9fem9ajvr'
WHERE "agencyId" IS NULL
  AND EXISTS (SELECT 1 FROM "Agency" WHERE "id" = 'cmu4tl0a40000ibb9fem9ajvr');

-- Backfill MarketingCampaignLog with audited Inca Bound agency
UPDATE "MarketingCampaignLog"
SET "agencyId" = 'cmu4tl0a40000ibb9fem9ajvr'
WHERE "agencyId" IS NULL
  AND EXISTS (SELECT 1 FROM "Agency" WHERE "id" = 'cmu4tl0a40000ibb9fem9ajvr');

-- ============================================================================
-- STEP 2: PREFLIGHT SAFETY ASSERTIONS (FAIL-CLOSED)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Tour" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Tour has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Transfer" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Transfer has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Category" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Category has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Blog" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Blog has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Coupon" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Coupon has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "VehicleType" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: VehicleType has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Reservation" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Reservation has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "TourAvailability" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: TourAvailability has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "ShoppingCart" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: ShoppingCart has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Order" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Order has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "MarketingCampaignLog" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: MarketingCampaignLog has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "FinancialAudit" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: FinancialAudit has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "ConfigurationAudit" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: ConfigurationAudit has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "CompanySettings" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: CompanySettings has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "LegalProfile" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: LegalProfile has rows with NULL agencyId';
  END IF;
  IF EXISTS (SELECT 1 FROM "Complaint" WHERE "agencyId" IS NULL) THEN
    RAISE EXCEPTION 'Safety check failed: Complaint has rows with NULL agencyId';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: DROP GLOBAL UNIQUE CONSTRAINTS / INDEXES
-- ============================================================================
ALTER TABLE "Blog" DROP CONSTRAINT IF EXISTS "Blog_slug_key";
DROP INDEX IF EXISTS "Blog_slug_key";

ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_slug_key";
DROP INDEX IF EXISTS "Category_slug_key";

ALTER TABLE "Coupon" DROP CONSTRAINT IF EXISTS "Coupon_code_key";
DROP INDEX IF EXISTS "Coupon_code_key";

ALTER TABLE "Tour" DROP CONSTRAINT IF EXISTS "Tour_slug_key";
DROP INDEX IF EXISTS "Tour_slug_key";

ALTER TABLE "Transfer" DROP CONSTRAINT IF EXISTS "Transfer_slug_key";
DROP INDEX IF EXISTS "Transfer_slug_key";

ALTER TABLE "VehicleType" DROP CONSTRAINT IF EXISTS "VehicleType_code_key";
DROP INDEX IF EXISTS "VehicleType_code_key";

-- ============================================================================
-- STEP 4: CREATE TENANT-SCOPED COMPOSITE UNIQUE INDEXES
-- ============================================================================
CREATE UNIQUE INDEX "Blog_agencyId_slug_key" ON "Blog"("agencyId", "slug");
CREATE UNIQUE INDEX "Category_agencyId_slug_key" ON "Category"("agencyId", "slug");
CREATE UNIQUE INDEX "Coupon_agencyId_code_key" ON "Coupon"("agencyId", "code");
CREATE UNIQUE INDEX "Tour_agencyId_slug_key" ON "Tour"("agencyId", "slug");
CREATE UNIQUE INDEX "Transfer_agencyId_slug_key" ON "Transfer"("agencyId", "slug");
CREATE UNIQUE INDEX "VehicleType_agencyId_code_key" ON "VehicleType"("agencyId", "code");

-- ============================================================================
-- STEP 5: ENFORCE NOT NULL ON agencyId
-- ============================================================================
ALTER TABLE "Blog" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "CompanySettings" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Complaint" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "ConfigurationAudit" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Coupon" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "FinancialAudit" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "LegalProfile" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "MarketingCampaignLog" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "ShoppingCart" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "TourAvailability" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "Transfer" ALTER COLUMN "agencyId" SET NOT NULL;
ALTER TABLE "VehicleType" ALTER COLUMN "agencyId" SET NOT NULL;
