/*
  Warnings:

  - You are about to drop the column `itemId` on the `ItemVarianceOnWebsites` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ItemVarianceOnWebsites" DROP CONSTRAINT "ItemVarianceOnWebsites_itemId_fkey";

-- DropIndex
DROP INDEX "ItemVarianceOnWebsites_itemId_key";

-- AlterTable
ALTER TABLE "ItemVarianceOnWebsites" DROP COLUMN "itemId";
