-- Page targeting for FAQs (Home / Category / Product pages).
-- Purely additive and idempotent: no data is dropped or rewritten. Existing
-- rows get showOnFaqPage = true so they keep showing on /faqs as before.

ALTER TABLE "FAQ"
  ADD COLUMN IF NOT EXISTS "showOnFaqPage"       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "showOnHome"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "showOnAllCategories" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "showOnAllProducts"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "categoryIds"         TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "productIds"          TEXT[] DEFAULT ARRAY[]::TEXT[];
