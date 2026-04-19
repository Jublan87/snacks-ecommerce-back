-- Migration: user_addresses_relational
-- Replaces User.shippingAddress Json? with a relational Address table.
-- Order: CREATE TABLE → data migration INSERT → DROP COLUMN (required to preserve existing data)

-- Step 1: Create Address table
CREATE TABLE "Address" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "address"    VARCHAR(500) NOT NULL,
    "city"       VARCHAR(100) NOT NULL,
    "province"   VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "notes"      VARCHAR(500),
    "label"      VARCHAR(100),
    "isDefault"  BOOLEAN NOT NULL DEFAULT false,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- Foreign key: Address → User (cascade delete)
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- Step 2: Data migration — copy existing User.shippingAddress JSON into Address rows
-- Only migrates rows where shippingAddress is non-null and all four required fields are present.
-- Skipped rows (null or missing fields) result in an empty addresses array — accepted per spec M3.
INSERT INTO "Address" ("id", "userId", "address", "city", "province", "postalCode", "notes", "isDefault", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."shippingAddress"->>'address',
    u."shippingAddress"->>'city',
    u."shippingAddress"->>'province',
    u."shippingAddress"->>'postalCode',
    u."shippingAddress"->>'notes',
    true,
    NOW(),
    NOW()
FROM "User" u
WHERE
    u."shippingAddress" IS NOT NULL
    AND u."shippingAddress"->>'address' IS NOT NULL
    AND u."shippingAddress"->>'city' IS NOT NULL
    AND u."shippingAddress"->>'province' IS NOT NULL
    AND u."shippingAddress"->>'postalCode' IS NOT NULL;

-- Step 3: Drop the old shippingAddress column AFTER data has been migrated
ALTER TABLE "User" DROP COLUMN "shippingAddress";
