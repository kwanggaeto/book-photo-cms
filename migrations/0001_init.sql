-- CreateTable
CREATE TABLE "Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uid" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_uid_key" ON "Photo"("uid");
