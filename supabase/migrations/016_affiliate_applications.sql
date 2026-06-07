-- ── Affiliate Applications ─────────────────────────────────────────────────

create table if not exists affiliate_applications (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  website       text,
  platform      text,
  audience_size text,
  about         text,
  status        text not null default 'pending',  -- pending | approved | rejected
  notes         text,                             -- admin notes
  created_at    timestamptz not null default now()
);

alter table affiliate_applications enable row level security;

-- Only service-role (admin) can read/write — public cannot access directly
create policy "service-role-only" on affiliate_applications
  using (false)
  with check (false);
