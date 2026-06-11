-- 019: casting labor per gram + iridium spot price seed
--
-- casting_labor_per_gram: per-gram casting/finishing cost applied to the
--   actual physical weight of the piece (weight × rate = casting cost, USD).
--   Admin sets this per product (e.g. 5 / 10 / 15 $/g).
--
-- iridium price: DANHOV uses 900Pt/100Ir alloy (not Pt950).
--   Iridium has no standard free API so we seed an initial row in
--   metal_prices; the admin can insert a new row when the market moves.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS casting_labor_per_gram numeric DEFAULT 10;

-- Seed initial iridium spot price (USD per gram).
-- Source: market rate ~$7,400/troy oz ÷ 31.1035 ≈ $237/g (Jun 2026).
-- Insert only if no iridium row exists yet.
INSERT INTO metal_prices (metal, price_per_gram_usd, source)
SELECT 'iridium', 237.0, 'manual'
WHERE NOT EXISTS (
  SELECT 1 FROM metal_prices WHERE metal = 'iridium'
);
