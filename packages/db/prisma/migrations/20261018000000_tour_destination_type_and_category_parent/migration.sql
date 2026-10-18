-- AlterTable
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- AlterTable
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "destinationType" TEXT DEFAULT 'Nacional';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Category_parentId_fkey'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
