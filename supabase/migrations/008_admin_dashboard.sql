-- ──────────────────────────────────────────────────────────────────────────
-- Admin dashboard — adds:
--   • admin_users        — marks which auth.users are admins
--   • site_content       — key/value editable strings powering every page
--   • RLS policies that let an authenticated admin manage every table
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email   text not null,
  created_at timestamptz default now()
);

create table if not exists site_content (
  key         text primary key,
  value       text not null,
  description text,
  category    text not null,
  updated_at  timestamptz default now(),
  updated_by  uuid references auth.users(id)
);
create index if not exists site_content_category_idx on site_content(category);

alter table site_content enable row level security;

drop policy if exists "Anyone reads site content" on site_content;
create policy "Anyone reads site content"
  on site_content for select to anon, authenticated using (true);

drop policy if exists "Admins write site content" on site_content;
create policy "Admins write site content"
  on site_content for insert to authenticated
  with check (auth.uid() in (select user_id from admin_users));

drop policy if exists "Admins update site content" on site_content;
create policy "Admins update site content"
  on site_content for update to authenticated
  using (auth.uid() in (select user_id from admin_users))
  with check (auth.uid() in (select user_id from admin_users));

drop policy if exists "Admins delete site content" on site_content;
create policy "Admins delete site content"
  on site_content for delete to authenticated
  using (auth.uid() in (select user_id from admin_users));

-- ──────────────────────────────────────────────────────────────────────────
-- Admin "manage everything" policies (additive — public SELECT policies stay)
-- ──────────────────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'products', 'orders', 'customers', 'consultations',
    'quote_locks', 'presentation_links', 'product_narratives',
    'media_uploads', 'conversations', 'metal_prices'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Admins manage %I" on %I', t, t);
    execute format($p$
      create policy "Admins manage %I"
        on %I for all to authenticated
        using (auth.uid() in (select user_id from admin_users))
        with check (auth.uid() in (select user_id from admin_users))
    $p$, t, t);
  end loop;
end$$;
