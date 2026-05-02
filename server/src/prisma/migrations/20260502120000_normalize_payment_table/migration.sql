-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "attemptStatus" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "providerReferenceId" TEXT,
    "providerCaptureId" TEXT,
    "approvalUrl" TEXT,
    "checkoutUrl" TEXT,
    "clientSecret" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "capturedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_providerReferenceId_idx" ON "Payment"("providerReferenceId");
CREATE INDEX "Payment_attemptStatus_idx" ON "Payment"("attemptStatus");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from legacy Order columns (requires migrations through add_order_payment_redirect_fields so optional URL columns exist)
INSERT INTO "Payment" (
    "id",
    "orderId",
    "method",
    "attemptStatus",
    "providerReferenceId",
    "providerCaptureId",
    "approvalUrl",
    "checkoutUrl",
    "clientSecret",
    "amount",
    "currency",
    "capturedAt",
    "metadata",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    o."id",
    o."paymentMethod",
    CASE o."paymentStatus"
        WHEN 'COMPLETED'::"PaymentStatus" THEN 'COMPLETED'::"PaymentAttemptStatus"
        WHEN 'FAILED'::"PaymentStatus" THEN 'FAILED'::"PaymentAttemptStatus"
        WHEN 'CANCELLED'::"PaymentStatus" THEN 'CANCELLED'::"PaymentAttemptStatus"
        WHEN 'APPROVED'::"PaymentStatus" THEN 'AUTHORIZED'::"PaymentAttemptStatus"
        ELSE 'PENDING'::"PaymentAttemptStatus"
    END,
    COALESCE(o."providerOrderId", o."paymentId"),
    o."providerCaptureId",
    o."approvalUrl",
    o."checkoutUrl",
    o."clientSecret",
    o."total",
    o."currency",
    o."capturedAt",
    NULL,
    o."createdAt",
    o."updatedAt"
FROM "Order" o
WHERE o."paymentId" IS NOT NULL
   OR o."providerOrderId" IS NOT NULL
   OR o."providerCaptureId" IS NOT NULL
   OR o."capturedAt" IS NOT NULL
   OR o."approvalUrl" IS NOT NULL
   OR o."checkoutUrl" IS NOT NULL;

DROP INDEX IF EXISTS "Order_paymentId_idx";
DROP INDEX IF EXISTS "Order_providerOrderId_idx";

ALTER TABLE "Order" DROP COLUMN IF EXISTS "paymentId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "providerOrderId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "providerCaptureId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "capturedAt";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "approvalUrl";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "checkoutUrl";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "clientSecret";
