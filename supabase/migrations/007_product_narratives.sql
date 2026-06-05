-- ──────────────────────────────────────────────────────────────────────────
-- Phase 5 — Dynamic Spiritual Messaging Engine (proposal §3.C)
--
-- One row per (product_slug, occasion) pair. Server generates via Claude
-- on first request and caches forever (re-generated only if you delete
-- the row). Public can read; only server can write.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists product_narratives (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  occasion text not null,
  narrative text not null,
  meta_description text,
  generated_at timestamptz default now(),
  unique (product_slug, occasion)
);

create index if not exists product_narratives_slug_idx on product_narratives(product_slug);

alter table product_narratives enable row level security;

drop policy if exists "Public can read narratives" on product_narratives;
create policy "Public can read narratives"
  on product_narratives for select
  to anon, authenticated
  using (true);
