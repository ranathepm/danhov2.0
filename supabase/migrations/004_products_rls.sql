-- ──────────────────────────────────────────────────────────────────────────
-- Lock down the products table: anyone (including unauthenticated visitors)
-- can READ active products, but only the service-role key (used by the
-- seed script and trusted server code) can INSERT / UPDATE / DELETE.
--
-- Without this, the publishable key shipped to the browser would allow
-- writes too. RLS = mandatory before going live.
-- ──────────────────────────────────────────────────────────────────────────

alter table products enable row level security;

drop policy if exists "Public can view active products" on products;

create policy "Public can view active products"
  on products
  for select
  to anon, authenticated
  using (is_active = true);
