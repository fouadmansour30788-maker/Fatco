-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN     "nameAr" TEXT;

-- CreateTable
CREATE TABLE "BundleComponent" (
    "id" TEXT NOT NULL,
    "bundleItemId" TEXT NOT NULL,
    "componentItemId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "BundleComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackInStockAlert" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "BackInStockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleComponent_bundleItemId_idx" ON "BundleComponent"("bundleItemId");

-- CreateIndex
CREATE INDEX "BackInStockAlert_itemId_idx" ON "BackInStockAlert"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BackInStockAlert_itemId_customerId_key" ON "BackInStockAlert"("itemId", "customerId");

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_bundleItemId_fkey" FOREIGN KEY ("bundleItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_componentItemId_fkey" FOREIGN KEY ("componentItemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockAlert" ADD CONSTRAINT "BackInStockAlert_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockAlert" ADD CONSTRAINT "BackInStockAlert_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
