/*
  Warnings:

  - You are about to drop the column `priceId` on the `Websites` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Websites" DROP CONSTRAINT "Websites_priceId_fkey";

-- DropIndex
DROP INDEX "Websites_priceId_key";

-- AlterTable
ALTER TABLE "Prices" ADD COLUMN     "websiteId" INTEGER;

-- AlterTable
ALTER TABLE "Websites" DROP COLUMN "priceId";

-- AddForeignKey
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Websites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
