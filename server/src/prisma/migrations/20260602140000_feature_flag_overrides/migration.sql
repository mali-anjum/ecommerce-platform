-- CreateEnum
CREATE TYPE "FeatureFlagValueType" AS ENUM ('BOOLEAN', 'STRING', 'NUMBER', 'JSON');

-- CreateTable
CREATE TABLE "FeatureFlagOverride" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL DEFAULT 'default',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "FeatureFlagValueType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlagOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeatureFlagOverride_clientId_idx" ON "FeatureFlagOverride"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlagOverride_clientId_key_key" ON "FeatureFlagOverride"("clientId", "key");
