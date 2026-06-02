-- CreateTable
CREATE TABLE "ai_product_search_index" (
    "productId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_product_search_index_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ai_product_search_index_meta" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lastSyncedAt" TIMESTAMP(3),
    "entryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_product_search_index_meta_pkey" PRIMARY KEY ("id")
);
