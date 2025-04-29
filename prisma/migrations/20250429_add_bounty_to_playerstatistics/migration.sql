-- Add bounty column to PlayerStatistics
ALTER TABLE "PlayerStatistics" ADD COLUMN "bounty" INTEGER NOT NULL DEFAULT 0;
