/*
  Warnings:

  - You are about to drop the `ItemDetails` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `ItemVariance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemDetails" DROP CONSTRAINT "ItemDetails_websiteId_fkey";

-- AlterTable
ALTER TABLE "ItemVariance" ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "price" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "details" TEXT,
ADD COLUMN     "highlights" TEXT[],
ADD COLUMN     "imageUrl" TEXT;

-- DropTable
DROP TABLE "ItemDetails";
