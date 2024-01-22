/*
  Warnings:

  - A unique constraint covering the columns `[itemId]` on the table `ItemVarianceOnWebsites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ItemVarianceOnWebsites_itemId_key" ON "ItemVarianceOnWebsites"("itemId");
