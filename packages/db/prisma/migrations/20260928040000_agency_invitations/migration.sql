-- CreateTable
CREATE TABLE "AgencyInvitation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AgencyMemberRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyInvitation_tokenHash_key" ON "AgencyInvitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyInvitation_agencyId_email_key" ON "AgencyInvitation"("agencyId", "email");

-- CreateIndex
CREATE INDEX "AgencyInvitation_agencyId_idx" ON "AgencyInvitation"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyInvitation_tokenHash_idx" ON "AgencyInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "AgencyInvitation_expiresAt_idx" ON "AgencyInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "AgencyInvitation" ADD CONSTRAINT "AgencyInvitation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyInvitation" ADD CONSTRAINT "AgencyInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
