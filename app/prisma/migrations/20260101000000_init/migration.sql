-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "textSheng" TEXT,
    "textStandard" TEXT,
    "turns" JSONB,
    "sourceType" TEXT NOT NULL,
    "sourceName" TEXT,
    "region" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "wordCount" INTEGER NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "goalWords" INTEGER NOT NULL DEFAULT 1000000,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_createdAt_idx" ON "Entry"("createdAt");

-- CreateIndex
CREATE INDEX "Entry_deleted_idx" ON "Entry"("deleted");
