-- DropColumn
ALTER TABLE "User" DROP COLUMN "passwordHash";

-- AddColumn
ALTER TABLE "User" ADD COLUMN "discordId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "image" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
