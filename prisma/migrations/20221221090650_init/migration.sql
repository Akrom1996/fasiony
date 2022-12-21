/*
  Warnings:

  - The primary key for the `VarianceOnItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `itemVarianceId` on the `VarianceOnItem` table. All the data in the column will be lost.
  - Added the required column `itemVarianceIdOnItem` to the `VarianceOnItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VarianceOnItem" DROP CONSTRAINT "VarianceOnItem_itemVarianceId_fkey";

-- AlterTable
ALTER TABLE "VarianceOnItem" DROP CONSTRAINT "VarianceOnItem_pkey",
DROP COLUMN "itemVarianceId",
ADD COLUMN     "itemVarianceIdOnItem" INTEGER NOT NULL,
ADD CONSTRAINT "VarianceOnItem_pkey" PRIMARY KEY ("itemId", "itemVarianceIdOnItem");

-- AddForeignKey
ALTER TABLE "VarianceOnItem" ADD CONSTRAINT "VarianceOnItem_itemVarianceIdOnItem_fkey" FOREIGN KEY ("itemVarianceIdOnItem") REFERENCES "ItemVariance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
