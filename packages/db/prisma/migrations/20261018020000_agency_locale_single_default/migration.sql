-- Partial unique index ensuring at most one default locale per agency
CREATE UNIQUE INDEX IF NOT EXISTS "AgencyLocale_agencyId_default_unique" ON "AgencyLocale"("agencyId") WHERE "isDefault" = true;
