-- DropForeignKey
ALTER TABLE "Websites" DROP CONSTRAINT "Websites_priceId_fkey";

-- AlterTable
ALTER TABLE "Websites" ALTER COLUMN "priceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Websites" ADD CONSTRAINT "Websites_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "Prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
