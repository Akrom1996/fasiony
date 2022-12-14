/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Websites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Websites_url_key" ON "Websites"("url");
