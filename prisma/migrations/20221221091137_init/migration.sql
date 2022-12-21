/*
  Warnings:

  - The primary key for the `VarianceOnItem` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "VarianceOnItem" DROP CONSTRAINT "VarianceOnItem_pkey",
ADD CONSTRAINT "VarianceOnItem_pkey" PRIMARY KEY ("itemId", "itemVarianceIdOnItem");
