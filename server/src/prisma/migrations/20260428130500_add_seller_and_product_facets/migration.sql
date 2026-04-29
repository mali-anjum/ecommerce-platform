-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'REFURBISHED', 'USED');

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
ADD COLUMN "sellerId" TEXT,
ADD COLUMN "discountPercent" DOUBLE PRECISION,
ADD COLUMN "dealStartsAt" TIMESTAMP(3),
ADD COLUMN "dealEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_slug_key" ON "Seller"("slug");

-- CreateIndex
CREATE INDEX "Seller_isPremium_isActive_idx" ON "Seller"("isPremium", "isActive");

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE INDEX "Product_condition_idx" ON "Product"("condition");

-- CreateIndex
CREATE INDEX "Product_discountPercent_idx" ON "Product"("discountPercent");

-- CreateIndex
CREATE INDEX "Product_dealStartsAt_dealEndsAt_idx" ON "Product"("dealStartsAt", "dealEndsAt");

-- AddForeignKey
ALTER TABLE "Product"
ADD CONSTRAINT "Product_sellerId_fkey"
FOREIGN KEY ("sellerId") REFERENCES "Seller"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
