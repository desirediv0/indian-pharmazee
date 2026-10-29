-- Add SEO fields to SubCategory table
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;
ALTER TABLE "SubCategory" ADD COLUMN IF NOT EXISTS "keywords" TEXT;
