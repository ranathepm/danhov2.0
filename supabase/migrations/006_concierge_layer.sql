-- ──────────────────────────────────────────────────────────────────────────
-- Phase 4 — White-Glove Concierge Layer
--
-- Locks down RLS on the sensitive tables (customers, consultations,
-- orders, presentation_links). Server-only writes; public reads only
-- where they make sense (a presentation link slug is the "secret").
--
-- Adds Stripe identifiers + shipping_country to orders.
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

-- Extra columns on orders so we can track Stripe state end-to-end
alter table orders add column if not exists stripe_checkout_session_id text;
alter table orders add column if not exists shipping_country text;
alter table orders add column if not exists currency text default 'usd';
alter table orders add column if not exists last_email_sent_at timestamptz;

create index if not exists orders_stripe_session_idx
  on orders(stripe_checkout_session_id);

-- ── CUSTOMERS — server only ───────────────────────────────────────────────
alter table customers enable row level security;
-- no public policies → anon/authenticated cannot read or write

-- ── CONSULTATIONS — server only ───────────────────────────────────────────
alter table consultations enable row level security;

-- ── ORDERS — server only ──────────────────────────────────────────────────
alter table orders enable row level security;

-- ── PRESENTATION_LINKS — public-by-slug read (the slug is the secret) ─────
alter table presentation_links enable row level security;

drop policy if exists "Anyone can view active presentation link" on presentation_links;
create policy "Anyone can view active presentation link"
  on presentation_links for select
  to anon, authenticated
  using (expires_at is null or expires_at > now());
