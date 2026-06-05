-- ──────────────────────────────────────────────────────────────────────────
-- Phase 2 — Live precious-metals pricing + 24h quote lock
--
-- Adds per-product fields needed to compute a live price:
--   • default_metal      — which metal we quote against by default
--                          ('14k_yellow' | '14k_white' | '14k_rose'
--                         | '18k_yellow' | '18k_white' | '18k_rose'
--                         | 'platinum')
--   • stones_value_usd   — value of diamonds/gemstones in the piece
--                          (added on top of metal × markup + labor)
--
-- Locks down RLS on quote_locks + metal_prices:
--   • metal_prices       — anyone can read the cached spot prices.
--   • quote_locks        — only the server (service-role) writes;
--                          email-owners can read their own locks
--                          (we use signed quote_id in URLs, not auth — so
--                           SELECT is denied to anon/authenticated entirely;
--                           the API route fetches with service-role).
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

alter table products add column if not exists default_metal text;
alter table products add column if not exists stones_value_usd numeric default 0;

-- metal_prices RLS — public read of the cached spot prices is fine
alter table metal_prices enable row level security;

drop policy if exists "Public can read metal prices" on metal_prices;
create policy "Public can read metal prices"
  on metal_prices for select
  to anon, authenticated
  using (true);

-- quote_locks RLS — server-only access. The API route mediates all reads/writes.
alter table quote_locks enable row level security;
-- (no policies → anon/authenticated cannot read or write; only service-role bypasses RLS)
