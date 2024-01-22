-- AlterTable
ALTER TABLE "ItemVarianceOnWebsites" ADD COLUMN     "itemId" INTEGER;

-- AddForeignKey
ALTER TABLE "ItemVarianceOnWebsites" ADD CONSTRAINT "ItemVarianceOnWebsites_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
