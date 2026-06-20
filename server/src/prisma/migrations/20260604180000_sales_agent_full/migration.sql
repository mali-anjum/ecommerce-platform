-- CreateEnum
CREATE TYPE "SalesCustomerSegment" AS ENUM ('BROWSER', 'HIGH_INTENT', 'CART_ABANDONER', 'RETURN_VISITOR', 'CONVERTED');

-- CreateEnum
CREATE TYPE "SalesEmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesEmailJobType" AS ENUM ('FOLLOW_UP_IMMEDIATE', 'FOLLOW_UP_1H', 'FOLLOW_UP_24H', 'FOLLOW_UP_72H');

-- CreateTable
CREATE TABLE "SalesCustomerProfile" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT,
    "userId" TEXT,
    "email" TEXT,
    "segment" "SalesCustomerSegment" NOT NULL DEFAULT 'BROWSER',
    "intentScore" INTEGER NOT NULL DEFAULT 0,
    "sessionId" TEXT,
    "offerCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesEmailJob" (
    "id" TEXT NOT NULL,
    "offerId" TEXT,
    "toEmail" TEXT NOT NULL,
    "jobType" "SalesEmailJobType" NOT NULL,
    "status" "SalesEmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesEmailJob_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "SalesAgentOffer" ADD COLUMN "intentScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SalesAgentOffer" ADD COLUMN "segment" "SalesCustomerSegment" NOT NULL DEFAULT 'BROWSER';

-- CreateIndex
CREATE UNIQUE INDEX "SalesCustomerProfile_visitorId_key" ON "SalesCustomerProfile"("visitorId");
CREATE UNIQUE INDEX "SalesCustomerProfile_userId_key" ON "SalesCustomerProfile"("userId");
CREATE INDEX "SalesCustomerProfile_segment_intentScore_idx" ON "SalesCustomerProfile"("segment", "intentScore");
CREATE INDEX "SalesCustomerProfile_email_idx" ON "SalesCustomerProfile"("email");
CREATE INDEX "SalesCustomerProfile_lastSeenAt_idx" ON "SalesCustomerProfile"("lastSeenAt");

-- CreateIndex
CREATE INDEX "SalesEmailJob_status_scheduledAt_idx" ON "SalesEmailJob"("status", "scheduledAt");
CREATE INDEX "SalesEmailJob_offerId_idx" ON "SalesEmailJob"("offerId");
CREATE INDEX "SalesEmailJob_toEmail_createdAt_idx" ON "SalesEmailJob"("toEmail", "createdAt");

-- CreateIndex
CREATE INDEX "SalesAgentOffer_intentScore_createdAt_idx" ON "SalesAgentOffer"("intentScore", "createdAt");
CREATE INDEX "SalesAgentOffer_segment_createdAt_idx" ON "SalesAgentOffer"("segment", "createdAt");
