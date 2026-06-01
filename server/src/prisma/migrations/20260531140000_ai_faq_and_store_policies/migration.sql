-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "href" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePolicySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "returnPolicy" TEXT NOT NULL DEFAULT '',
    "shippingPolicy" TEXT NOT NULL DEFAULT '',
    "shipsInternationally" BOOLEAN NOT NULL DEFAULT false,
    "internationalShippingDetails" TEXT NOT NULL DEFAULT '',
    "supportEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePolicySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FaqItem_isActive_sortOrder_idx" ON "FaqItem"("isActive", "sortOrder");
