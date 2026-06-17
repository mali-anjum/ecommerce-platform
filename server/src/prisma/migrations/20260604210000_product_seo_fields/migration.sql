-- AlterTable
ALTER TABLE "Product" ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "metaDescription" TEXT,
ADD COLUMN "seoKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
