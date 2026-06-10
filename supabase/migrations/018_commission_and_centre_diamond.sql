-- 018_commission_and_centre_diamond.sql
-- Adds multiplier-based labour inputs and per-product commission to products.
--
-- setting_multiplier : the ×4/×6/×8/×10 rate; setting labour = total_stone_count × this
-- centre_diamond_group: JSONB spec of the centre stone (same shape as stone_groups rows)
-- centre_multiplier  : the ×25/×50/×75/×100 rate; centre labour = centre_count × this
-- commission_rate    : percentage added to the sub-total (e.g. 20 → +20 %)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS setting_multiplier   numeric DEFAULT 4,
  ADD COLUMN IF NOT EXISTS centre_diamond_group jsonb,
  ADD COLUMN IF NOT EXISTS centre_multiplier    numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS commission_rate      numeric DEFAULT 0;
