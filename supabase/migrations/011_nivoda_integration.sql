-- ──────────────────────────────────────────────────────────────────────────
-- Nivoda GraphQL API integration
--
-- Nivoda rate-limits to one request per 30 seconds, so customer-facing
-- search/detail flows MUST hit our cache, not Nivoda directly. We cache:
--
--   • the auth token (6-hour TTL on Nivoda's side; we refresh at 5h50m)
--   • search results (10-minute TTL, keyed by deterministic filter hash)
--   • stone detail (60-second TTL — fresh enough for checkout confidence)
--
-- We also persist:
--   • holds we've placed (so we can cancel them or convert to orders)
--   • Nivoda order references on DANHOV orders (so /admin/orders can show
--     "Nivoda Order #..." and the studio can reconcile shipments)
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

-- ── TOKEN CACHE — single row replaced on refresh ──────────────────────────
create table if not exists nivoda_tokens (
  id          text primary key default 'default',
  token       text not null,
  expires_at  timestamptz not null,
  updated_at  timestamptz default now()
);

-- ── SEARCH RESULT CACHE — keyed by filter hash, 10-minute TTL ────────────
create table if not exists nivoda_search_cache (
  filter_hash text primary key,
  payload     jsonb not null,
  fetched_at  timestamptz default now()
);
create index if not exists nivoda_search_cache_fetched_idx
  on nivoda_search_cache(fetched_at);

-- ── STONE DETAIL CACHE — keyed by offer_id, 60-second TTL ────────────────
create table if not exists nivoda_stone_cache (
  offer_id    text primary key,
  payload     jsonb not null,
  fetched_at  timestamptz default now()
);
create index if not exists nivoda_stone_cache_fetched_idx
  on nivoda_stone_cache(fetched_at);

-- ── HOLDS — track every hold so we can release or convert ─────────────────
create table if not exists nivoda_holds (
  id              uuid primary key default gen_random_uuid(),
  offer_id        text not null,
  nivoda_hold_id  text,
  session_id      text not null,
  status          text not null default 'active',
  -- 'active' | 'cancelled' | 'expired' | 'converted'
  held_until      timestamptz,
  customer_email  text,
  setting_slug    text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index if not exists nivoda_holds_offer_idx on nivoda_holds(offer_id);
create index if not exists nivoda_holds_session_idx on nivoda_holds(session_id);
create index if not exists nivoda_holds_status_idx on nivoda_holds(status);

-- ── NIVODA ORDER LINK on the DANHOV orders table ──────────────────────────
alter table orders add column if not exists nivoda_offer_id text;
alter table orders add column if not exists nivoda_order_id text;
alter table orders add column if not exists nivoda_hold_id text;

-- ── RLS — all tables server-only (service role bypasses anyway) ───────────
alter table nivoda_tokens enable row level security;
alter table nivoda_search_cache enable row level security;
alter table nivoda_stone_cache enable row level security;
alter table nivoda_holds enable row level security;
-- no policies = anon/authenticated cannot read; only service role can.
