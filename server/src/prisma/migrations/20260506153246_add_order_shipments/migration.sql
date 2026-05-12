-- AlterTable
ALTER TABLE "OrderTrackingEvent" ADD COLUMN     "shipmentId" TEXT;

-- CreateTable
CREATE TABLE "OrderShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'DEFAULT',
    "sellerId" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "estimatedDeliveryAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderShipment_orderId_idx" ON "OrderShipment"("orderId");

-- CreateIndex
CREATE INDEX "OrderShipment_sellerId_idx" ON "OrderShipment"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderShipment_orderId_key_key" ON "OrderShipment"("orderId", "key");

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_shipmentId_occurredAt_idx" ON "OrderTrackingEvent"("shipmentId", "occurredAt");

-- AddForeignKey
ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderShipment" ADD CONSTRAINT "OrderShipment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTrackingEvent" ADD CONSTRAINT "OrderTrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "OrderShipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
