-- ──────────────────────────────────────────────────────────────────────────
-- Per-metal image galleries
--
-- Adds products.metal_images — a JSONB map of metal slug → ordered array
-- of image URLs. Lets the studio upload separate photos for each metal
-- variant (yellow / white / rose / platinum) so the product detail page
-- can swap the visible gallery when a customer clicks a metal swatch.
--
-- Shape:
--   {
--     "14k_yellow":  ["https://.../yellow-hero.jpg", "https://.../yellow-side.jpg"],
--     "14k_white":   ["https://.../white-hero.jpg"],
--     "14k_rose":    ["https://.../rose-hero.jpg"],
--     "18k_yellow":  [...],
--     ...
--   }
--
-- Backwards compatible: products without a metal_images entry fall back
-- to the existing `images` column.
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

alter table products
  add column if not exists metal_images jsonb;

comment on column products.metal_images is
  'Per-metal image arrays keyed by metal slug (e.g. {"14k_yellow": [...], "14k_white": [...]}). Null/missing keys fall back to products.images.';
