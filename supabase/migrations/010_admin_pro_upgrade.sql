-- ──────────────────────────────────────────────────────────────────────────
-- Admin Pro upgrade
--
-- 1. Products: platinum-equivalent weight + stone metadata so the AI
--    product wizard can compute everything from minimal admin inputs.
-- 2. Orders: per-order overrides (admin can edit weight, diamonds, ring
--    size, engraving, metal, shipping address, tracking after the order
--    is placed). Plus a labor_breakdown jsonb mirroring the labor cats.
-- 3. labor_categories: 5 admin-editable categories (seeded with sane
--    defaults). The order detail recomputes labor cost from these.
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

-- ── PRODUCTS — AI-wizard fields ────────────────────────────────────────────
alter table products add column if not exists platinum_weight_g numeric;
alter table products add column if not exists stone_count integer default 0;
alter table products add column if not exists stone_size_mm numeric;

-- ── ORDERS — admin-editable extensibility ─────────────────────────────────
alter table orders add column if not exists custom_overrides jsonb default '{}'::jsonb;
alter table orders add column if not exists notes text;
alter table orders add column if not exists shipping_address jsonb;
alter table orders add column if not exists tracking_number text;
alter table orders add column if not exists tracking_carrier text;
alter table orders add column if not exists labor_breakdown jsonb default '{}'::jsonb;
alter table orders add column if not exists product_sku text;
alter table orders add column if not exists product_name text;

-- ── LABOR CATEGORIES — admin-editable ─────────────────────────────────────
create table if not exists labor_categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  label           text not null,
  unit_price_usd  numeric not null default 0,
  unit            text not null default 'flat',         -- 'flat' | 'per_stone' | 'per_character'
  applies_to      text not null default 'all',          -- 'all' | 'white_gold' | 'engraved_only'
  position        integer not null default 0,
  is_active       boolean not null default true,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists labor_categories_position_idx on labor_categories(position);

-- Seed the 5 default categories the client described
insert into labor_categories (slug, label, unit_price_usd, unit, applies_to, position) values
  ('casting',   'Casting & Mold',                        250, 'flat',          'all',            1),
  ('setting',   'Stone Setting',                          55, 'per_stone',     'all',            2),
  ('polishing', 'Hand Polishing & Finishing',            175, 'flat',          'all',            3),
  ('plating',   'Rhodium Plating',                        80, 'flat',          'white_gold',     4),
  ('engraving', 'Inside Band Engraving',                  65, 'flat',          'engraved_only',  5)
on conflict (slug) do nothing;

alter table labor_categories enable row level security;

drop policy if exists "Public can read labor categories" on labor_categories;
create policy "Public can read labor categories"
  on labor_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage labor categories" on labor_categories;
create policy "Admins can manage labor categories"
  on labor_categories for all
  to authenticated
  using (exists (select 1 from admin_users where user_id = auth.uid()))
  with check (exists (select 1 from admin_users where user_id = auth.uid()));
