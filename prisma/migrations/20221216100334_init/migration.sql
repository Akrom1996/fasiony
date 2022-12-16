-- CreateTable
CREATE TABLE "Prices" (
    "id" SERIAL NOT NULL,
    "price" INTEGER,
    "dateTime" TIMESTAMP(3),
    "itemsId" INTEGER NOT NULL,

    CONSTRAINT "Prices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Prices" ADD CONSTRAINT "Prices_itemsId_fkey" FOREIGN KEY ("itemsId") REFERENCES "Items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
