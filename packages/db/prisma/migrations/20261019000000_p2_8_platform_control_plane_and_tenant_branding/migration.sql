-- Platform Control Plane & Tenant Co-Branding Foundation

-- Platform Admin
CREATE TABLE IF NOT EXISTS "PlatformAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'SUPERADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- Platform Session
CREATE TABLE IF NOT EXISTS "PlatformSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platformAdminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformSession_platformAdminId_fkey" FOREIGN KEY ("platformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSession_tokenHash_key" ON "PlatformSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "PlatformSession_platformAdminId_idx" ON "PlatformSession"("platformAdminId");

-- Platform Settings (Singleton)
CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL DEFAULT 'Acrov SaaS',
    "logoUrl" TEXT,
    "iconUrl" TEXT,
    "supportEmail" TEXT,
    "brandingRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "brandingRewardCredits" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Platform Audit Log
CREATE TABLE IF NOT EXISTS "PlatformAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platformAdminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformAuditLog_platformAdminId_fkey" FOREIGN KEY ("platformAdminId") REFERENCES "PlatformAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PlatformAuditLog_platformAdminId_idx" ON "PlatformAuditLog"("platformAdminId");
CREATE INDEX IF NOT EXISTS "PlatformAuditLog_action_idx" ON "PlatformAuditLog"("action");
CREATE INDEX IF NOT EXISTS "PlatformAuditLog_entity_entityId_idx" ON "PlatformAuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");

-- Tenant Co-Branding Preference
CREATE TABLE IF NOT EXISTS "AgencyBrandingPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL UNIQUE,
    "platformBrandingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rewardLockedUntil" TIMESTAMP(3),
    "lastRewardPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgencyBrandingPreference_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tenant Branding Reward Claim
CREATE TABLE IF NOT EXISTS "BrandingRewardClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agencyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "ledgerId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandingRewardClaim_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BrandingRewardClaim_agencyId_period_key" ON "BrandingRewardClaim"("agencyId", "period");
CREATE INDEX IF NOT EXISTS "BrandingRewardClaim_agencyId_idx" ON "BrandingRewardClaim"("agencyId");
