-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SESSION_PING';

-- CreateEnum
CREATE TYPE "SalesOfferTrigger" AS ENUM ('PRODUCT_CLUSTER', 'CART_ABANDON', 'HIGH_BROWSING', 'RETURN_VISIT');

-- CreateEnum
CREATE TYPE "SalesOfferStatus" AS ENUM ('PENDING', 'SHOWN', 'DISMISSED', 'EMAIL_SENT', 'CONVERTED');

-- CreateTable
CREATE TABLE "SalesAgentOffer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "email" TEXT,
    "intentSummary" TEXT NOT NULL,
    "triggerReason" "SalesOfferTrigger" NOT NULL,
    "viewedProductIds" JSONB NOT NULL DEFAULT '[]',
    "recommendedProductIds" JSONB NOT NULL DEFAULT '[]',
    "couponId" TEXT,
    "couponCode" TEXT,
    "discountPercent" DOUBLE PRECISION,
    "leadId" TEXT,
    "status" "SalesOfferStatus" NOT NULL DEFAULT 'PENDING',
    "emailSentAt" TIMESTAMP(3),
    "shownAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAgentOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesAgentOffer_sessionId_status_createdAt_idx" ON "SalesAgentOffer"("sessionId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAgentOffer_userId_status_createdAt_idx" ON "SalesAgentOffer"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAgentOffer_visitorId_createdAt_idx" ON "SalesAgentOffer"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAgentOffer_status_createdAt_idx" ON "SalesAgentOffer"("status", "createdAt");
