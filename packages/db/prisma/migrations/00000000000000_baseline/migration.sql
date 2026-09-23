-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'PAYMENT_RECEIVED_REVIEW', 'FAILED', 'EXPIRED', 'LEGACY_UNKNOWN');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'PAYMENT_EXPIRED', 'PAYMENT_RECEIVED_REVIEW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REQUIRES_REVIEW', 'RECEIVED_REVIEW');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('META_ADS', 'TIKTOK_ADS', 'GOOGLE_ADS', 'EMAIL_MARKETING', 'ORGANIC_VIDEO');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'MASTER', 'OPERATOR', 'CONTENT_CREATOR', 'MARKETING');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "logoUrl" TEXT,
    "iconUrl" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "region" TEXT,
    "menuGroup" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "bannerImage" TEXT NOT NULL,
    "cardImage" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "altitude" TEXT,
    "transport" TEXT,
    "groupSize" TEXT,
    "difficulty" TEXT,
    "mapImage" TEXT,
    "hasSharedService" BOOLEAN NOT NULL DEFAULT true,
    "sharedPrice" DOUBLE PRECISION,
    "hasPrivateService" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourItineraryDay" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourInclusion" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourInclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourExclusion" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourRecommendation" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourFaq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPrivatePricing" (
    "id" TEXT NOT NULL,
    "pax" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "TourPrivatePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogParagraph" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "subtitle" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "BlogParagraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "tripType" TEXT NOT NULL DEFAULT 'Solo ida',
    "description" TEXT,
    "bannerImage" TEXT,
    "hasSharedService" BOOLEAN NOT NULL DEFAULT false,
    "sharedPrice" DOUBLE PRECISION,
    "hasPrivateService" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "maxPax" INTEGER NOT NULL,
    "maxLuggage" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "features" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferVehiclePrice" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TransferVehiclePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourAvailability" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "tourId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TourAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingCart" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'TOURS',
    "items" JSONB NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT ('AG-' || upper(substr(md5(random()::text), 1, 20))),
    "agencyId" TEXT,
    "accessTokenHash" TEXT,
    "accessVersion" INTEGER NOT NULL DEFAULT 0,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "ReservationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refundedMinor" INTEGER NOT NULL DEFAULT 0,
    "cartId" TEXT NOT NULL,
    "checkoutKey" TEXT NOT NULL,
    "quoteFingerprint" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TOURS',
    "state" "OrderState" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "buyerFirstName" TEXT NOT NULL,
    "buyerLastName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotalMinor" INTEGER NOT NULL,
    "discountMinor" INTEGER NOT NULL DEFAULT 0,
    "igvMinor" INTEGER NOT NULL DEFAULT 0,
    "cardFeeMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL,
    "requiredPaymentMinor" INTEGER NOT NULL,
    "paidMinor" INTEGER NOT NULL DEFAULT 0,
    "remainingMinor" INTEGER NOT NULL,
    "igvEnabled" BOOLEAN NOT NULL DEFAULT false,
    "igvBps" INTEGER NOT NULL DEFAULT 1800,
    "cardFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cardFeeBps" INTEGER NOT NULL DEFAULT 0,
    "partialPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "initialPaymentBps" INTEGER NOT NULL DEFAULT 5000,
    "availabilityEnforced" BOOLEAN NOT NULL DEFAULT false,
    "couponId" TEXT,
    "marketingCode" TEXT,
    "source" TEXT DEFAULT 'WEB',
    "assignedOperatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cartLineId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceKind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "modality" TEXT NOT NULL,
    "pax" INTEGER NOT NULL,
    "pricingUnit" TEXT NOT NULL DEFAULT 'PER_TRAVELER',
    "tierPax" INTEGER,
    "baseAmountMinor" INTEGER NOT NULL,
    "subtotalMinor" INTEGER NOT NULL,
    "vehicleId" TEXT,
    "vehicleName" TEXT,
    "pickupTime" TEXT,
    "pickupHotel" TEXT,
    "specialNotes" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'DNI',
    "documentNumber" TEXT NOT NULL,

    CONSTRAINT "Traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CULQI',
    "environment" TEXT NOT NULL DEFAULT 'test',
    "accountId" TEXT NOT NULL,
    "state" "PaymentState" NOT NULL DEFAULT 'CREATED',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "providerReference" TEXT,
    "receivedMinor" INTEGER NOT NULL DEFAULT 0,
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "legacyId" TEXT,
    "audience" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "snapshot" JSONB,
    "envelope" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "firstAttemptAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "PaymentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT DEFAULT ('AG-L-' || upper(substr(md5(random()::text), 1, 20))),
    "agencyId" TEXT,
    "accessTokenHash" TEXT,
    "accessVersion" INTEGER NOT NULL DEFAULT 0,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "ReservationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidMinor" INTEGER NOT NULL DEFAULT 0,
    "refundedMinor" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT,
    "transferId" TEXT,
    "vehicleTypeId" TEXT,
    "serviceType" TEXT,
    "pickupTime" TEXT,
    "customerFirstName" TEXT NOT NULL,
    "customerLastName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pax" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pickupHotel" TEXT,
    "specialRequirements" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "marketingCode" TEXT,
    "source" TEXT DEFAULT 'WEB',
    "couponId" TEXT,
    "discountAmount" DOUBLE PRECISION DEFAULT 0,
    "originalPrice" DOUBLE PRECISION,
    "assignedOperatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationItem" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "tourId" TEXT,
    "transferId" TEXT,
    "vehicleTypeId" TEXT,
    "serviceType" TEXT NOT NULL DEFAULT 'shared',
    "date" TIMESTAMP(3) NOT NULL,
    "pax" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "pickupHotel" TEXT,
    "pickupTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationPassenger" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'DNI',
    "docNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "channel" "MarketingChannel" NOT NULL DEFAULT 'META_ADS',
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "discountValueMinor" INTEGER,
    "minSpend" DOUBLE PRECISION DEFAULT 0,
    "minSpendMinor" INTEGER DEFAULT 0,
    "maxDiscount" DOUBLE PRECISION,
    "maxDiscountMinor" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION DEFAULT 0,
    "budgetMinor" INTEGER DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaignLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "campaignCode" TEXT NOT NULL DEFAULT 'MK1',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "flyerUrl" TEXT,
    "whatsappUrl" TEXT,
    "sentByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingCampaignLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "passwordChangedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAudit" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "requestId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "orderId" TEXT,
    "legacyId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL_ADMIN',
    "previousBooking" "BookingStatus" NOT NULL,
    "newBooking" "BookingStatus" NOT NULL,
    "previousPayment" "ReservationPaymentStatus" NOT NULL,
    "newPayment" "ReservationPaymentStatus" NOT NULL,
    "amountMinor" INTEGER,
    "reference" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigurationAudit" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "actorId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigurationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "igvEnabled" BOOLEAN NOT NULL DEFAULT false,
    "igvBps" INTEGER NOT NULL DEFAULT 1800,
    "cardFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cardFeeBps" INTEGER NOT NULL DEFAULT 0,
    "partialPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "initialPaymentBps" INTEGER NOT NULL DEFAULT 5000,
    "availabilityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalProfile" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "number" SERIAL NOT NULL,
    "accessHash" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "receipt" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintHistory" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "actorId" TEXT,
    "status" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintDelivery" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "envelope" JSONB,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failureCode" TEXT,
    "attemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationAccess" (
    "hash" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationAccess_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "LookupRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LookupRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "OperationsJob" (
    "id" TEXT NOT NULL,
    "reconciliationCursor" TEXT,
    "owner" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "failureCode" TEXT,

    CONSTRAINT "OperationsJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToTour" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_subdomain_key" ON "Agency"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_customDomain_key" ON "Agency"("customDomain");

-- CreateIndex
CREATE INDEX "Agency_slug_idx" ON "Agency"("slug");

-- CreateIndex
CREATE INDEX "Agency_subdomain_idx" ON "Agency"("subdomain");

-- CreateIndex
CREATE INDEX "Agency_isActive_idx" ON "Agency"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");

-- CreateIndex
CREATE INDEX "Tour_agencyId_idx" ON "Tour"("agencyId");

-- CreateIndex
CREATE INDEX "Tour_slug_idx" ON "Tour"("slug");

-- CreateIndex
CREATE INDEX "Tour_isFeatured_idx" ON "Tour"("isFeatured");

-- CreateIndex
CREATE INDEX "TourImage_tourId_idx" ON "TourImage"("tourId");

-- CreateIndex
CREATE INDEX "TourItineraryDay_tourId_idx" ON "TourItineraryDay"("tourId");

-- CreateIndex
CREATE INDEX "TourInclusion_tourId_idx" ON "TourInclusion"("tourId");

-- CreateIndex
CREATE INDEX "TourExclusion_tourId_idx" ON "TourExclusion"("tourId");

-- CreateIndex
CREATE INDEX "TourRecommendation_tourId_idx" ON "TourRecommendation"("tourId");

-- CreateIndex
CREATE INDEX "TourFaq_tourId_idx" ON "TourFaq"("tourId");

-- CreateIndex
CREATE INDEX "TourPrivatePricing_tourId_idx" ON "TourPrivatePricing"("tourId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_agencyId_idx" ON "Category"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE INDEX "Blog_agencyId_idx" ON "Blog"("agencyId");

-- CreateIndex
CREATE INDEX "BlogParagraph_blogId_idx" ON "BlogParagraph"("blogId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_slug_key" ON "Transfer"("slug");

-- CreateIndex
CREATE INDEX "Transfer_agencyId_idx" ON "Transfer"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_code_key" ON "VehicleType"("code");

-- CreateIndex
CREATE INDEX "TransferVehiclePrice_transferId_idx" ON "TransferVehiclePrice"("transferId");

-- CreateIndex
CREATE INDEX "TransferVehiclePrice_vehicleId_idx" ON "TransferVehiclePrice"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferVehiclePrice_transferId_vehicleId_key" ON "TransferVehiclePrice"("transferId", "vehicleId");

-- CreateIndex
CREATE INDEX "TourAvailability_agencyId_idx" ON "TourAvailability"("agencyId");

-- CreateIndex
CREATE INDEX "TourAvailability_tourId_date_idx" ON "TourAvailability"("tourId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TourAvailability_tourId_date_key" ON "TourAvailability"("tourId", "date");

-- CreateIndex
CREATE INDEX "ShoppingCart_agencyId_idx" ON "ShoppingCart"("agencyId");

-- CreateIndex
CREATE INDEX "ShoppingCart_expiresAt_idx" ON "ShoppingCart"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessTokenHash_key" ON "Order"("accessTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");

-- CreateIndex
CREATE INDEX "Order_agencyId_idx" ON "Order"("agencyId");

-- CreateIndex
CREATE INDEX "Order_state_expiresAt_idx" ON "Order"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "Order_buyerEmail_idx" ON "Order"("buyerEmail");

-- CreateIndex
CREATE INDEX "Order_marketingCode_idx" ON "Order"("marketingCode");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- CreateIndex
CREATE INDEX "Order_assignedOperatorId_idx" ON "Order"("assignedOperatorId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_serviceId_date_idx" ON "OrderItem"("serviceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_cartLineId_key" ON "OrderItem"("orderId", "cartLineId");

-- CreateIndex
CREATE INDEX "Traveler_orderItemId_idx" ON "Traveler"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_providerReference_key" ON "PaymentAttempt"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentAttempt_state_expiresAt_idx" ON "PaymentAttempt"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");

-- CreateIndex
CREATE INDEX "PaymentNotification_state_createdAt_idx" ON "PaymentNotification"("state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentNotification_orderId_audience_kind_key" ON "PaymentNotification"("orderId", "audience", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentNotification_legacyId_audience_kind_key" ON "PaymentNotification"("legacyId", "audience", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "Reservation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_accessTokenHash_key" ON "Reservation"("accessTokenHash");

-- CreateIndex
CREATE INDEX "Reservation_agencyId_idx" ON "Reservation"("agencyId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_createdAt_idx" ON "Reservation"("createdAt");

-- CreateIndex
CREATE INDEX "Reservation_tourId_idx" ON "Reservation"("tourId");

-- CreateIndex
CREATE INDEX "Reservation_transferId_idx" ON "Reservation"("transferId");

-- CreateIndex
CREATE INDEX "Reservation_customerEmail_idx" ON "Reservation"("customerEmail");

-- CreateIndex
CREATE INDEX "Reservation_marketingCode_idx" ON "Reservation"("marketingCode");

-- CreateIndex
CREATE INDEX "Reservation_couponId_idx" ON "Reservation"("couponId");

-- CreateIndex
CREATE INDEX "Reservation_assignedOperatorId_idx" ON "Reservation"("assignedOperatorId");

-- CreateIndex
CREATE INDEX "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationItem_tourId_idx" ON "ReservationItem"("tourId");

-- CreateIndex
CREATE INDEX "ReservationItem_transferId_idx" ON "ReservationItem"("transferId");

-- CreateIndex
CREATE INDEX "ReservationPassenger_reservationId_idx" ON "ReservationPassenger"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_agencyId_idx" ON "Coupon"("agencyId");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_channel_idx" ON "Coupon"("channel");

-- CreateIndex
CREATE INDEX "Coupon_startDate_endDate_idx" ON "Coupon"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");

-- CreateIndex
CREATE INDEX "MarketingCampaignLog_agencyId_idx" ON "MarketingCampaignLog"("agencyId");

-- CreateIndex
CREATE INDEX "MarketingCampaignLog_customerEmail_idx" ON "MarketingCampaignLog"("customerEmail");

-- CreateIndex
CREATE INDEX "MarketingCampaignLog_campaignCode_idx" ON "MarketingCampaignLog"("campaignCode");

-- CreateIndex
CREATE INDEX "MarketingCampaignLog_createdAt_idx" ON "MarketingCampaignLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_sessionToken_key" ON "AdminSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");

-- CreateIndex
CREATE INDEX "AdminSession_sessionToken_idx" ON "AdminSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_userId_idx" ON "AdminAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entity_entityId_idx" ON "AdminAuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAudit_requestId_key" ON "FinancialAudit"("requestId");

-- CreateIndex
CREATE INDEX "FinancialAudit_agencyId_idx" ON "FinancialAudit"("agencyId");

-- CreateIndex
CREATE INDEX "FinancialAudit_orderId_createdAt_idx" ON "FinancialAudit"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialAudit_legacyId_createdAt_idx" ON "FinancialAudit"("legacyId", "createdAt");

-- CreateIndex
CREATE INDEX "ConfigurationAudit_agencyId_idx" ON "ConfigurationAudit"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_agencyId_key" ON "CompanySettings"("agencyId");

-- CreateIndex
CREATE INDEX "CompanySettings_agencyId_idx" ON "CompanySettings"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalProfile_agencyId_key" ON "LegalProfile"("agencyId");

-- CreateIndex
CREATE INDEX "LegalProfile_agencyId_idx" ON "LegalProfile"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_number_key" ON "Complaint"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_accessHash_key" ON "Complaint"("accessHash");

-- CreateIndex
CREATE INDEX "Complaint_agencyId_idx" ON "Complaint"("agencyId");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "ComplaintHistory_complaintId_idx" ON "ComplaintHistory"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintDelivery_complaintId_idx" ON "ComplaintDelivery"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintDelivery_state_createdAt_idx" ON "ComplaintDelivery"("state", "createdAt");

-- CreateIndex
CREATE INDEX "ReservationAccess_expiresAt_idx" ON "ReservationAccess"("expiresAt");

-- CreateIndex
CREATE INDEX "LookupRateLimit_expiresAt_idx" ON "LookupRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToTour_AB_unique" ON "_CategoryToTour"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToTour_B_index" ON "_CategoryToTour"("B");

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourImage" ADD CONSTRAINT "TourImage_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourItineraryDay" ADD CONSTRAINT "TourItineraryDay_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourInclusion" ADD CONSTRAINT "TourInclusion_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourExclusion" ADD CONSTRAINT "TourExclusion_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourRecommendation" ADD CONSTRAINT "TourRecommendation_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourFaq" ADD CONSTRAINT "TourFaq_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPrivatePricing" ADD CONSTRAINT "TourPrivatePricing_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogParagraph" ADD CONSTRAINT "BlogParagraph_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferVehiclePrice" ADD CONSTRAINT "TransferVehiclePrice_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferVehiclePrice" ADD CONSTRAINT "TransferVehiclePrice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "VehicleType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourAvailability" ADD CONSTRAINT "TourAvailability_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingCart" ADD CONSTRAINT "ShoppingCart_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "ShoppingCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentNotification" ADD CONSTRAINT "PaymentNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentNotification" ADD CONSTRAINT "PaymentNotification_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "VehicleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationPassenger" ADD CONSTRAINT "ReservationPassenger_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignLog" ADD CONSTRAINT "MarketingCampaignLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAudit" ADD CONSTRAINT "FinancialAudit_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAudit" ADD CONSTRAINT "FinancialAudit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAudit" ADD CONSTRAINT "FinancialAudit_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAudit" ADD CONSTRAINT "FinancialAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationAudit" ADD CONSTRAINT "ConfigurationAudit_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigurationAudit" ADD CONSTRAINT "ConfigurationAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalProfile" ADD CONSTRAINT "LegalProfile_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintHistory" ADD CONSTRAINT "ComplaintHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintHistory" ADD CONSTRAINT "ComplaintHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintDelivery" ADD CONSTRAINT "ComplaintDelivery_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTour" ADD CONSTRAINT "_CategoryToTour_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToTour" ADD CONSTRAINT "_CategoryToTour_B_fkey" FOREIGN KEY ("B") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
