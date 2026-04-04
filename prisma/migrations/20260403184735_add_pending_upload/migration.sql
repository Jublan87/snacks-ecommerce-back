-- CreateTable
CREATE TABLE "PendingUpload" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingUpload_storageKey_idx" ON "PendingUpload"("storageKey");

-- CreateIndex
CREATE INDEX "PendingUpload_createdAt_idx" ON "PendingUpload"("createdAt");
