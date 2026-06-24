-- ── Wishlist ──────────────────────────────────────────────────────────────
-- Each row represents one product saved by one authenticated user.
-- Safe to re-run.

create table if not exists wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_slug text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, product_slug)
);

alter table wishlists enable row level security;

-- Users can only see and manage their own wishlist rows
drop policy if exists "wishlist: owner select" on wishlists;
create policy "wishlist: owner select"
  on wishlists for select using (auth.uid() = user_id);

drop policy if exists "wishlist: owner insert" on wishlists;
create policy "wishlist: owner insert"
  on wishlists for insert with check (auth.uid() = user_id);

drop policy if exists "wishlist: owner delete" on wishlists;
create policy "wishlist: owner delete"
  on wishlists for delete using (auth.uid() = user_id);
