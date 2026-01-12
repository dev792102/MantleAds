-- AlterTable
ALTER TABLE "public"."publishers" ADD COLUMN "website_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "publishers_website_id_key" ON "public"."publishers"("website_id");

