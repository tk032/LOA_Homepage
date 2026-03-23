-- Add isGoldCharacter to Character
ALTER TABLE "Character" ADD COLUMN "isGoldCharacter" BOOLEAN NOT NULL DEFAULT true;

-- Add isGoldTarget to RaidSelection
ALTER TABLE "RaidSelection" ADD COLUMN "isGoldTarget" BOOLEAN NOT NULL DEFAULT false;
