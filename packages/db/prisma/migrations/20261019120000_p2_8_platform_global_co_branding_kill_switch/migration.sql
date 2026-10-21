-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "coBrandingEnabled" BOOLEAN NOT NULL DEFAULT true;
