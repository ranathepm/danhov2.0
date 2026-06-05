/**
 * Phase 2 first-pass pricing model.
 *
 * DANHOV specializes in 14k and 18k gold (yellow / white / rose) — no
 * platinum or silver. For each of the 114 products, set:
 *   • gold_weight_g       — estimated metal mass
 *   • default_metal       — which metal we quote against (14k_* or 18k_*)
 *   • markup_multiplier   — applied to (weight × purity × spot)
 *   • base_labor_usd      — fixed per-piece craftsmanship cost
 *   • stones_value_usd    — diamonds + gemstones bundled
 *
 * These are *first-pass estimates per collection/category*, calibrated so
 * the live price lands within ~10% of the legacy "From $X,XXX" display.
 * When per-SKU weights become available, re-run with real numbers and the
 * upsert by SKU will replace these.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false }, realtime: { transport: ws as unknown as typeof WebSocket } }
);

type Defaults = {
  gold_weight_g: number;
  default_metal: string;
  markup_multiplier: number;
  base_labor_usd: number;
  stones_value_usd: number;
};

// ── Engagement-ring defaults by collection ────────────────────────────────
const ENGAGEMENT_DEFAULTS: Record<string, Defaults> = {
  abbraccio:  { gold_weight_g: 5.0, default_metal: '18k_yellow', markup_multiplier: 4.0, base_labor_usd: 1100, stones_value_usd: 2800 },
  voltaggio:  { gold_weight_g: 3.8, default_metal: '14k_white',  markup_multiplier: 3.5, base_labor_usd: 950,  stones_value_usd: 1600 },
  classico:   { gold_weight_g: 4.5, default_metal: '18k_yellow', markup_multiplier: 4.0, base_labor_usd: 1000, stones_value_usd: 2400 },
  norme:      { gold_weight_g: 5.0, default_metal: '18k_yellow', markup_multiplier: 4.2, base_labor_usd: 1100, stones_value_usd: 2800 },
  carezza:    { gold_weight_g: 4.0, default_metal: '14k_white',  markup_multiplier: 3.8, base_labor_usd: 1000, stones_value_usd: 2200 },
  'per-lei':  { gold_weight_g: 4.0, default_metal: '14k_white',  markup_multiplier: 3.8, base_labor_usd: 1000, stones_value_usd: 2200 },
  petalo:     { gold_weight_g: 5.2, default_metal: '18k_yellow', markup_multiplier: 4.0, base_labor_usd: 1200, stones_value_usd: 2600 },
  solo:       { gold_weight_g: 3.5, default_metal: '18k_white',  markup_multiplier: 4.0, base_labor_usd: 900,  stones_value_usd: 2000 },
  eleganza:   { gold_weight_g: 5.0, default_metal: '18k_yellow', markup_multiplier: 4.0, base_labor_usd: 1100, stones_value_usd: 2600 },
  couture:    { gold_weight_g: 6.0, default_metal: '18k_yellow', markup_multiplier: 4.2, base_labor_usd: 1300, stones_value_usd: 3200 },
  unito:      { gold_weight_g: 4.5, default_metal: '18k_yellow', markup_multiplier: 4.0, base_labor_usd: 1100, stones_value_usd: 2500 },
};

// ── Category defaults (fallbacks for non-engagement products) ─────────────
const CATEGORY_DEFAULTS: Record<string, Defaults> = {
  wedding: { gold_weight_g: 4.5, default_metal: '14k_white',  markup_multiplier: 3.5, base_labor_usd: 850,  stones_value_usd: 1200 },
  fine:    { gold_weight_g: 3.0, default_metal: '14k_white',  markup_multiplier: 3.6, base_labor_usd: 800,  stones_value_usd: 800  },
  mens:    { gold_weight_g: 7.0, default_metal: '14k_yellow', markup_multiplier: 3.5, base_labor_usd: 950,  stones_value_usd: 500  },
};

function deriveCollectionSlug(collection: string | null): string | null {
  if (!collection) return null;
  const map: Record<string, string> = {
    abbraccio: 'abbraccio',
    voltaggio: 'voltaggio',
    classico: 'classico',
    'norme de danhov': 'norme',
    norme: 'norme',
    carezza: 'carezza',
    'per lei': 'per-lei',
    petalo: 'petalo',
    'solo filo': 'solo',
    eleganza: 'eleganza',
    couture: 'couture',
    unito: 'unito',
  };
  return map[collection.toLowerCase()] ?? null;
}

async function main() {
  const { data: products, error } = await client
    .from('products')
    .select('sku, collection, category');
  if (error || !products) {
    console.error('Failed to load products:', error?.message);
    process.exit(1);
  }
  console.log(`→ Loaded ${products.length} products`);

  let updated = 0;
  let skipped = 0;

  for (const p of products as Array<{ sku: string; collection: string | null; category: string }>) {
    let defaults: Defaults | undefined;

    if (p.category === 'engagement') {
      const slug = deriveCollectionSlug(p.collection);
      defaults = slug ? ENGAGEMENT_DEFAULTS[slug] : undefined;
    }

    if (!defaults) defaults = CATEGORY_DEFAULTS[p.category];

    if (!defaults) {
      console.log(`  ⤬ ${p.sku} — no defaults for category=${p.category} collection=${p.collection}`);
      skipped++;
      continue;
    }

    const { error: updErr } = await client
      .from('products')
      .update({
        gold_weight_g: defaults.gold_weight_g,
        default_metal: defaults.default_metal,
        markup_multiplier: defaults.markup_multiplier,
        base_labor_usd: defaults.base_labor_usd,
        stones_value_usd: defaults.stones_value_usd,
      })
      .eq('sku', p.sku);

    if (updErr) {
      console.error(`  ✗ ${p.sku} update failed:`, updErr.message);
      continue;
    }
    updated++;
  }

  console.log(`\n✓ Pricing defaults applied: ${updated} updated, ${skipped} skipped`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
