-- CreateTable
CREATE TABLE "WebsiteUrls" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteUrls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Items" (
    "id" SERIAL NOT NULL,
    "itemName" TEXT NOT NULL,

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
    "websitesId" INTEGER NOT NULL,
    "itemVarianceId" INTEGER NOT NULL,

    CONSTRAINT "ItemVarianceOnWebsites_pkey" PRIMARY KEY ("websitesId","itemVarianceId")
);

-- CreateTable
CREATE TABLE "ItemDetails" (
    "id" SERIAL NOT NULL,
    "price" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,
    "websiteId" INTEGER NOT NULL,

    CONSTRAINT "ItemDetails_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "ItemDetails_websiteId_key" ON "ItemDetails"("websiteId");

-- AddForeignKey
ALTER TABLE "ItemVariance" ADD CONSTRAINT "ItemVariance_itemsId_fkey" FOREIGN KEY ("itemsId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVarianceOnWebsites" ADD CONSTRAINT "ItemVarianceOnWebsites_websitesId_fkey" FOREIGN KEY ("websitesId") REFERENCES "Websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemVarianceOnWebsites" ADD CONSTRAINT "ItemVarianceOnWebsites_itemVarianceId_fkey" FOREIGN KEY ("itemVarianceId") REFERENCES "ItemVariance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemDetails" ADD CONSTRAINT "ItemDetails_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Websites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
