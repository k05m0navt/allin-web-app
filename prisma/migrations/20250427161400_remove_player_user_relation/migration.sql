/*
  Warnings:

  - You are about to drop the column `userId` on the `Player` table. All the data in the column will be lost.
  - Added the required column `phone` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegram` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_userId_fkey";

-- DropIndex
DROP INDEX "Player_userId_key";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "userId",
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "telegram" TEXT NOT NULL;
