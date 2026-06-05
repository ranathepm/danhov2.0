-- ──────────────────────────────────────────────────────────────────────────
-- Multiple stone groups + split labour
--
-- Lets the studio spec more than one set of stones on a piece (e.g. a
-- centre group plus accent melee), each with its own count, mm size and
-- diamond shape, and split the labour figure into two line items:
--   • base_labor_usd     → re-used as "Jewellery labour"
--   • diamond_labor_usd  → new "Diamond labour"
--
-- stone_groups shape (JSONB array):
--   [
--     { "count": 1,  "size_mm": 6.5, "shape": "round" },
--     { "count": 38, "size_mm": 1.3, "shape": "round" }
--   ]
--
-- Backwards compatible: products without stone_groups fall back to the
-- single stone_count_input / stone_size_mm columns. The editor mirrors
-- the first group back into those columns on save so existing reads keep
-- working.
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

alter table products
  add column if not exists stone_groups      jsonb,
  add column if not exists diamond_labor_usd numeric(10,2);

comment on column products.stone_groups is
  'Array of stone groups: [{count, size_mm, shape}]. Null/missing falls back to stone_count_input + stone_size_mm.';
comment on column products.diamond_labor_usd is
  'Diamond-setting labour (USD). Pairs with base_labor_usd which is the jewellery labour.';
