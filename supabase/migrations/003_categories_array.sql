-- ──────────────────────────────────────────────────────────────────────────
-- Some legacy products belong to multiple categories (e.g. wedding bands
-- that also appear under men's). A single `category` column can't hold
-- that — adding a JSONB array so one product row covers every listing it
-- belongs to. The original `category` column stays as a "primary" hint.
-- ──────────────────────────────────────────────────────────────────────────

alter table products add column if not exists categories jsonb default '[]'::jsonb;
create index if not exists products_categories_idx on products using gin (categories);
