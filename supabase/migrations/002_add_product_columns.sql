-- ──────────────────────────────────────────────────────────────────────────
-- Adds the columns the listing-page JSON needs that weren't in the
-- original products schema:
--   • category         — 'engagement' | 'wedding' | 'fine' | 'mens'
--   • sub_categories   — extra filter tokens (e.g. ['her-bands', 'award-winners'])
--   • price_display    — legacy display string ("From $5,390") until live
--                        precious-metals pricing replaces it in Phase 2.
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

alter table products add column if not exists category text;
alter table products add column if not exists sub_categories jsonb default '[]'::jsonb;
alter table products add column if not exists price_display text;

create index if not exists products_category_idx on products(category);
