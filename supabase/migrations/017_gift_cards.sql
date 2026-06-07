-- ── Gift Cards ─────────────────────────────────────────────────────────────

create table if not exists gift_cards (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique not null,
  amount_usd              integer not null,          -- in whole dollars
  sender_name             text not null,
  sender_email            text not null,
  recipient_name          text not null,
  recipient_email         text not null,
  message                 text,
  deliver_at              timestamptz,               -- null = send immediately
  status                  text not null default 'pending',  -- pending | active | redeemed | cancelled
  stripe_session_id       text,
  stripe_payment_intent   text,
  redeemed_at             timestamptz,
  redeemed_by_order_id    uuid,
  created_at              timestamptz not null default now()
);

alter table gift_cards enable row level security;

-- Public can read a single card by code (for balance check)
create policy "read-own-card" on gift_cards
  for select using (true);

-- Only service-role can insert/update
create policy "service-role-write" on gift_cards
  for all using (false) with check (false);
