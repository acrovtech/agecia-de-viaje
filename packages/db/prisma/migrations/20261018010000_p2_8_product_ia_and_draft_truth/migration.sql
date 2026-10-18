-- Correct Category foreign key to SET NULL
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_parentId_fkey";
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tour draft-safe fields (allow incomplete drafts honestly without fabricated business data)
ALTER TABLE "Tour" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "bannerImage" DROP NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "cardImage" DROP NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "duration" DROP NOT NULL;
ALTER TABLE "Tour" ALTER COLUMN "hasSharedService" SET DEFAULT false;
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "focusKeyphrase" TEXT;

-- Entitlements and Catalog Locales
CREATE TABLE IF NOT EXISTS "AgencyEntitlement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agencyId" TEXT NOT NULL UNIQUE,
  "maxCatalogLocales" INTEGER NOT NULL DEFAULT 1,
  "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
  "aiMonthlyCredits" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgencyEntitlement_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AgencyLocale" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agencyId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgencyLocale_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AgencyLocale_agencyId_locale_key" ON "AgencyLocale"("agencyId", "locale");
CREATE INDEX IF NOT EXISTS "AgencyLocale_agencyId_idx" ON "AgencyLocale"("agencyId");
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyLocale_agencyId_default_unique" ON "AgencyLocale"("agencyId") WHERE "isDefault" = true;

-- Tour Localized Content Snapshot Model
CREATE TABLE IF NOT EXISTS "TourLocalizedContent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tourId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "itinerary" JSONB,
  "inclusions" JSONB,
  "exclusions" JSONB,
  "recommendations" JSONB,
  "faqs" JSONB,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "focusKeyphrase" TEXT,
  "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
  "sourceRevision" TEXT,
  "reviewStatus" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TourLocalizedContent_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TourLocalizedContent_tourId_locale_key" ON "TourLocalizedContent"("tourId", "locale");
CREATE INDEX IF NOT EXISTS "TourLocalizedContent_tourId_idx" ON "TourLocalizedContent"("tourId");

-- AI Credit Accounting Ledger
CREATE TABLE IF NOT EXISTS "AiCreditAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agencyId" TEXT NOT NULL UNIQUE,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCreditAccount_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AiCreditLedger" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agencyId" TEXT NOT NULL,
  "userId" TEXT,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCreditLedger_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AiCreditLedger_agencyId_idx" ON "AiCreditLedger"("agencyId");

-- Tenant / User Product Feedback
CREATE TABLE IF NOT EXISTS "ProductFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "agencyId" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "clusterKey" TEXT,
  "rewardCredits" INTEGER,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductFeedback_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductFeedback_agencyId_idx" ON "ProductFeedback"("agencyId");
CREATE INDEX IF NOT EXISTS "ProductFeedback_clusterKey_idx" ON "ProductFeedback"("clusterKey");
