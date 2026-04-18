-- Migration: add salePrice, costPrice to Product; add costPriceSnapshot to OrderItem
-- Strategy: add new columns as nullable, populate data, make NOT NULL, drop old price column

-- Step 1: Add new columns as nullable
ALTER TABLE "Product" ADD COLUMN "salePrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2);

-- Step 2: Populate data from existing price column
UPDATE "Product" SET "salePrice" = "price", "costPrice" = 0;

-- Step 3: Make new columns NOT NULL
ALTER TABLE "Product" ALTER COLUMN "salePrice" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "costPrice" SET NOT NULL;

-- Step 4: Drop old price column
ALTER TABLE "Product" DROP COLUMN "price";

-- Step 5: Add costPriceSnapshot to OrderItem (with default 0, so no data migration needed)
ALTER TABLE "OrderItem" ADD COLUMN "costPriceSnapshot" DECIMAL(10,2) NOT NULL DEFAULT 0;
