-- CreateEnum
CREATE TYPE "AgencyMemberRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "AgencyMembership" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AgencyMemberRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiSession" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgencyMembership_userId_isActive_idx" ON "AgencyMembership"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyMembership_agencyId_userId_key" ON "AgencyMembership"("agencyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiSession_tokenHash_key" ON "ApiSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiSession_membershipId_revokedAt_idx" ON "ApiSession"("membershipId", "revokedAt");

-- CreateIndex
CREATE INDEX "ApiSession_expiresAt_idx" ON "ApiSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiSession" ADD CONSTRAINT "ApiSession_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
