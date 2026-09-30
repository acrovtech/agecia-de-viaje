-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('MEMBERSHIP_INVITATION', 'RESERVATION_CREATED', 'RESERVATION_CONFIRMED', 'RESERVATION_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('CUSTOMER', 'INTERNAL', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationState" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "TransactionalNotification" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "audience" "NotificationAudience" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "state" "NotificationState" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedBy" TEXT,
    "claimExpiresAt" TIMESTAMP(3),
    "firstAttemptAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransactionalNotification_agencyId_idempotencyKey_key" ON "TransactionalNotification"("agencyId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "TransactionalNotification_agencyId_createdAt_idx" ON "TransactionalNotification"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionalNotification_state_nextAttemptAt_idx" ON "TransactionalNotification"("state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "TransactionalNotification_state_claimExpiresAt_idx" ON "TransactionalNotification"("state", "claimExpiresAt");

-- AddForeignKey
ALTER TABLE "TransactionalNotification" ADD CONSTRAINT "TransactionalNotification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
