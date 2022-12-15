/*
  Warnings:

  - A unique constraint covering the columns `[dateTime]` on the table `ItemVarianceOnWebsites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ItemVarianceOnWebsites_dateTime_key" ON "ItemVarianceOnWebsites"("dateTime");
