-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('PDF', 'MANUAL');

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeBase_isActive_createdAt_idx" ON "KnowledgeBase"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeBase_sourceType_idx" ON "KnowledgeBase"("sourceType");
