-- CreateTable
CREATE TABLE "WebsiteUrls" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteUrls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Items" (
    "id" SERIAL NOT NULL,
    "itemName" TEXT NOT NULL,
    "details" TEXT,
    "imageUrl" TEXT,
    "highlights" TEXT[],

    CONSTRAINT "Items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVariance" (
    "id" SERIAL NOT NULL,
    "varianceName" TEXT NOT NULL,
    "itemsId" INTEGER NOT NULL,

    CONSTRAINT "ItemVariance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Websites" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemVarianceOnWebsites" (
    "id" SERIAL NOT NULL,
    "websitesId" INTEGER NOT NULL,
    "itemVarianceId" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemVarianceOnWebsites_pkey" PRIMARY KEY ("websitesId","itemVarianceId","dateTime")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteUrls_url_key" ON "WebsiteUrls"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Items_itemName_key" ON "Items"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVariance_varianceName_key" ON "ItemVariance"("varianceName");

-- CreateIndex
CREATE UNIQUE INDEX "Websites_url_key" ON "Websites"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ItemVarianceOnWebsites_dateTime_key" ON "ItemVarianceOnWebsites"("dateTime");

-- AddForeignKey
ALTER TABLE "ItemVariance" ADD CONSTRAINT "ItemVariance_itemsId_fkey" FOREIGN KEY ("itemsId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVarianceOnWebsites" ADD CONSTRAINT "ItemVarianceOnWebsites_websitesId_fkey" FOREIGN KEY ("websitesId") REFERENCES "Websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVarianceOnWebsites" ADD CONSTRAINT "ItemVarianceOnWebsites_itemVarianceId_fkey" FOREIGN KEY ("itemVarianceId") REFERENCES "ItemVariance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
