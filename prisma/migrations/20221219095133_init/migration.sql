/*
  Warnings:

  - You are about to drop the `ItemPricesOnWebsites` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `priceId` to the `Websites` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemPricesOnWebsites" DROP CONSTRAINT "ItemPricesOnWebsites_itemPriceId_fkey";

-- DropForeignKey
ALTER TABLE "ItemPricesOnWebsites" DROP CONSTRAINT "ItemPricesOnWebsites_websitesId_fkey";

-- AlterTable
ALTER TABLE "Prices" ADD COLUMN     "dateTime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "price" TEXT;

-- AlterTable
ALTER TABLE "Websites" ADD COLUMN     "priceId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ItemPricesOnWebsites";

-- AddForeignKey
ALTER TABLE "Websites" ADD CONSTRAINT "Websites_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
