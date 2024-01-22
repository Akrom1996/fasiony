/*
  Warnings:

  - You are about to drop the `VarianceOnItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VarianceOnItem" DROP CONSTRAINT "VarianceOnItem_itemId_fkey";

-- DropForeignKey
ALTER TABLE "VarianceOnItem" DROP CONSTRAINT "VarianceOnItem_itemVarianceIdOnItem_fkey";

-- DropTable
DROP TABLE "VarianceOnItem";

-- CreateTable
CREATE TABLE "_ItemVarianceToItems" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ItemVarianceToItems_AB_unique" ON "_ItemVarianceToItems"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemVarianceToItems_B_index" ON "_ItemVarianceToItems"("B");

-- AddForeignKey
ALTER TABLE "_ItemVarianceToItems" ADD CONSTRAINT "_ItemVarianceToItems_A_fkey" FOREIGN KEY ("A") REFERENCES "ItemVariance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemVarianceToItems" ADD CONSTRAINT "_ItemVarianceToItems_B_fkey" FOREIGN KEY ("B") REFERENCES "Items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
