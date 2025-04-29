-- Add reentries column to PlayerTournament
ALTER TABLE "PlayerTournament" ADD COLUMN "reentries" INTEGER NOT NULL DEFAULT 0;
