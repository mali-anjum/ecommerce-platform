-- AlterEnum: marketplace seller role (safe if already applied)
ALTER TYPE "Role" ADD VALUE 'SELLER';

-- Seller ↔ User (optional link for seller accounts)
ALTER TABLE "Seller" ADD COLUMN "userId" TEXT;

CREATE UNIQUE INDEX "Seller_userId_key" ON "Seller"("userId");

ALTER TABLE "Seller"
  ADD CONSTRAINT "Seller_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order line attribution for multi-vendor reporting
ALTER TABLE "OrderItem" ADD COLUMN "sellerId" TEXT;

CREATE INDEX "OrderItem_sellerId_idx" ON "OrderItem"("sellerId");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
