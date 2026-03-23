-- Initialize isGoldTarget for all existing raid selections
-- (they defaulted to false when the column was added)
UPDATE "RaidSelection" SET "isGoldTarget" = true;

-- Ensure all existing characters are marked as gold characters
UPDATE "Character" SET "isGoldCharacter" = true;
