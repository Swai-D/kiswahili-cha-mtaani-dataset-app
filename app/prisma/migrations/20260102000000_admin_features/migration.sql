-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "qualityFlag" TEXT NOT NULL DEFAULT 'haijakaguliwa';
ALTER TABLE "Entry" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Entry_qualityFlag_idx" ON "Entry"("qualityFlag");
