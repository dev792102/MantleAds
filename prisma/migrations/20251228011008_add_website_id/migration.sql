-- AlterTable
ALTER TABLE "public"."publishers" ADD COLUMN IF NOT EXISTS "website_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "publishers_website_id_key" ON "public"."publishers"("website_id") WHERE "website_id" IS NOT NULL;

