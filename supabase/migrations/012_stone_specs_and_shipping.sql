-- ──────────────────────────────────────────────────────────────────────────
-- Stone specs on products + shipping cost on orders
--
-- Adds the manual stone-spec columns the studio enters when creating a
-- product:
--   stone_count_input    number of melee / accent stones on the piece
--   stone_size_mm        mm size of each stone (assumed uniform)
--   accounting_cost_usd  internal cost the studio uses on the books
--
-- Also adds shipping_cost_usd to orders so the admin can capture it on
-- the order detail screen and have it flow through to the invoice.
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

alter table products
  add column if not exists stone_count_input integer,
  add column if not exists stone_size_mm     numeric(5,2),
  add column if not exists accounting_cost_usd numeric(10,2);

comment on column products.stone_count_input is 'Manual count of accent/melee stones on the piece.';
comment on column products.stone_size_mm     is 'Diameter of each accent stone in mm (assumed uniform).';
comment on column products.accounting_cost_usd is 'Internal accounting cost (visible in /admin/accounting).';

alter table orders
  add column if not exists shipping_cost_usd numeric(10,2);

comment on column orders.shipping_cost_usd is 'Shipping cost the studio captures on the order before invoicing.';
