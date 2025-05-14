-- AlterTable
ALTER TABLE "PlayerTournament" ALTER COLUMN "reentries" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "buyin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rebuy" INTEGER NOT NULL DEFAULT 0;
