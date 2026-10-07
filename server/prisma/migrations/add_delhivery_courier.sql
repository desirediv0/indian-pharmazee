-- Delhivery as a second courier next to Shiprocket.
-- Purely additive and idempotent: nothing is dropped or rewritten. Existing
-- orders only get one back-filled column (courierProvider) so the admin panel
-- knows which courier already shipped them.

CREATE TABLE IF NOT EXISTS "DelhiverySettings" (
  "id"             TEXT PRIMARY KEY,
  "isEnabled"      BOOLEAN NOT NULL DEFAULT false,
  "clientName"     TEXT,
  "apiToken"       TEXT,
  "sellerGstTin"   TEXT,
  "defaultHsnCode" TEXT,
  "defaultLength"  DOUBLE PRECISION NOT NULL DEFAULT 10,
  "defaultBreadth" DOUBLE PRECISION NOT NULL DEFAULT 10,
  "defaultHeight"  DOUBLE PRECISION NOT NULL DEFAULT 10,
  "defaultWeight"  DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "bookingMode"    TEXT NOT NULL DEFAULT 'AUTO',
  "shippingSpeed"  TEXT NOT NULL DEFAULT 'SURFACE',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy"      TEXT
);

ALTER TABLE "ShiprocketSettings"
  ADD COLUMN IF NOT EXISTS "defaultCourier" TEXT NOT NULL DEFAULT 'SHIPROCKET';

ALTER TABLE "ShiprocketPickupAddress"
  ADD COLUMN IF NOT EXISTS "delhiverySynced" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "courierProvider"    TEXT,
  ADD COLUMN IF NOT EXISTS "courierStatus"      TEXT,
  ADD COLUMN IF NOT EXISTS "courierSpeed"       TEXT,
  ADD COLUMN IF NOT EXISTS "courierWarehouseId" TEXT;

-- Orders already sent through Shiprocket
UPDATE "Order"
   SET "courierProvider" = 'SHIPROCKET'
 WHERE "shiprocketOrderId" IS NOT NULL
   AND "courierProvider" IS NULL;
