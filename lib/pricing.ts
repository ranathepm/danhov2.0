/**
 * Pricing engine — Phase 2.
 *
 * DANHOV specializes in 14k and 18k gold only (yellow, white, rose) —
 * no platinum, silver, or palladium. All pricing is driven by the live
 * 24k gold spot from GoldAPI, scaled by the product's purity.
 *
 * Computes a live price for a product by:
 *   1. Reading today's gold (XAU) spot price from our `metal_prices`
 *      cache table. If stale (>24h), fetch fresh from GoldAPI and refresh.
 *   2. Applying weight × purity_factor × spot × markup + labor + stones.
 *
 * Paid GoldAPI tier — we refresh every 2 hours so the displayed price
 * tracks intraday market moves closely. Cache key: most-recent row in
 * metal_prices newer than (now - 2h).
 */

import { createServiceClient } from '@/lib/supabase/server';

const GOLDAPI_BASE = 'https://www.goldapi.io/api';
const OUNCE_TO_GRAMS = 31.1035;

export type MetalKind = 'gold';

const PURITY: Record<string, { factor: number; rhodium_uplift_usd: number }> = {
  '14k_yellow': { factor: 0.585, rhodium_uplift_usd: 0 },
  '14k_white':  { factor: 0.585, rhodium_uplift_usd: 60 },  // rhodium plating cost
  '14k_rose':   { factor: 0.585, rhodium_uplift_usd: 0 },
  '18k_yellow': { factor: 0.750, rhodium_uplift_usd: 0 },
  '18k_white':  { factor: 0.750, rhodium_uplift_usd: 80 },
  '18k_rose':   { factor: 0.750, rhodium_uplift_usd: 0 },
};

export const PURITY_LABEL: Record<string, string> = {
  '14k_yellow': '14k Yellow Gold',
  '14k_white':  '14k White Gold',
  '14k_rose':   '14k Rose Gold',
  '18k_yellow': '18k Yellow Gold',
  '18k_white':  '18k White Gold',
  '18k_rose':   '18k Rose Gold',
};

/**
 * Parse a product's metals array (e.g. ["14k Rose", "White", "Yellow Gold"])
 * into the available metal-key options the customer can pick. The first
 * item carries the purity prefix; subsequent items inherit it.
 */
export function availableMetals(metals: string[]): string[] {
  if (!metals || metals.length === 0) return [];
  const first = metals[0] ?? '';
  const purityMatch = first.match(/(14k|18k)/i);
  if (!purityMatch) return [];
  const purity = purityMatch[1].toLowerCase();

  const colorOrder = ['yellow', 'white', 'rose'];
  const detectColor = (s: string): string | null => {
    const lower = s.toLowerCase();
    for (const c of colorOrder) if (lower.includes(c)) return c;
    return null;
  };

  const colors = new Set<string>();
  for (const m of metals) {
    const c = detectColor(m);
    if (c) colors.add(c);
  }

  return colorOrder
    .filter((c) => colors.has(c))
    .map((c) => `${purity}_${c}`);
}

export type SpotPrice = {
  price_per_gram_usd: number;
  fetched_at: string;
};

/**
 * Fetch the latest 24k gold spot price per gram, using a 24h cache in
 * metal_prices. Service-role only — never call this from client code.
 */
export async function getGoldSpot(): Promise<SpotPrice> {
  const client = createServiceClient();

  // 1) Check cache — most recent row for gold (2-hour TTL on paid tier)
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await client
    .from('metal_prices')
    .select('price_per_gram_usd, fetched_at')
    .eq('metal', 'gold')
    .gte('fetched_at', cutoff)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return {
      price_per_gram_usd: Number(cached.price_per_gram_usd),
      fetched_at: cached.fetched_at as string,
    };
  }

  // 2) Cache miss — hit GoldAPI
  const token = process.env.GOLDAPI_TOKEN;
  if (!token) throw new Error('GOLDAPI_TOKEN missing');

  const res = await fetch(`${GOLDAPI_BASE}/XAU/USD`, {
    headers: { 'x-access-token': token, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Fall back to most-recent stale row if any — better stale than nothing
    const { data: anyOld } = await client
      .from('metal_prices')
      .select('price_per_gram_usd, fetched_at')
      .eq('metal', 'gold')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (anyOld) {
      return {
        price_per_gram_usd: Number(anyOld.price_per_gram_usd),
        fetched_at: anyOld.fetched_at as string,
      };
    }
    throw new Error(`GoldAPI request failed (${res.status}) and no cache available`);
  }

  const payload = (await res.json()) as { price?: number; price_gram_24k?: number };
  const perGram =
    typeof payload.price_gram_24k === 'number'
      ? payload.price_gram_24k
      : (payload.price ?? 0) / OUNCE_TO_GRAMS;

  if (!perGram || perGram <= 0) {
    throw new Error('GoldAPI returned an invalid price');
  }

  await client.from('metal_prices').insert({
    metal: 'gold',
    price_per_gram_usd: perGram,
    source: 'goldapi',
  });

  return {
    price_per_gram_usd: perGram,
    fetched_at: new Date().toISOString(),
  };
}

export type PricingInputs = {
  default_metal: string | null;
  gold_weight_g: number | null;
  markup_multiplier: number | null;
  base_labor_usd: number | null;
  diamond_labor_usd?: number | null;
  stones_value_usd: number | null;
};

export type PriceBreakdown = {
  total_usd: number;
  metal_cost_usd: number;
  metal_with_markup_usd: number;
  labor_usd: number;
  stones_usd: number;
  rhodium_uplift_usd: number;
  metal_used: string;
  metal_label: string;
  spot_per_gram_usd: number;
  spot_fetched_at: string;
};

/**
 * Pure compute (no DB / network) — given the product's pricing inputs,
 * a chosen metal (or the product's default), and the 24k gold spot per
 * gram, return the final price + breakdown.
 */
export function computePrice(
  p: PricingInputs,
  spotPerGram24k: number,
  spotFetchedAt: string,
  metalChoice?: string | null
): PriceBreakdown {
  const metalKey = metalChoice && PURITY[metalChoice]
    ? metalChoice
    : (p.default_metal && PURITY[p.default_metal] ? p.default_metal : '14k_yellow');
  const purity = PURITY[metalKey];

  const weight = p.gold_weight_g ?? 0;
  const metalCost = weight * purity.factor * spotPerGram24k;
  const markup = p.markup_multiplier ?? 4.0;
  const metalWithMarkup = metalCost * markup;
  // Total labour = jewellery labour (base) + diamond-setting labour.
  const labor = (p.base_labor_usd ?? 1000) + (p.diamond_labor_usd ?? 0);
  const stones = p.stones_value_usd ?? 0;
  const rhodium = purity.rhodium_uplift_usd;
  const total = metalWithMarkup + labor + stones + rhodium;

  return {
    total_usd: Math.round(total),
    metal_cost_usd: Math.round(metalCost * 100) / 100,
    metal_with_markup_usd: Math.round(metalWithMarkup),
    labor_usd: labor,
    stones_usd: stones,
    rhodium_uplift_usd: rhodium,
    metal_used: metalKey,
    metal_label: PURITY_LABEL[metalKey] ?? metalKey,
    spot_per_gram_usd: Math.round(spotPerGram24k * 100) / 100,
    spot_fetched_at: spotFetchedAt,
  };
}

/**
 * Full pipeline: fetch today's gold spot (cached) and compute.
 */
export async function priceProduct(
  p: PricingInputs,
  metalChoice?: string | null
): Promise<PriceBreakdown> {
  const spot = await getGoldSpot();
  return computePrice(p, spot.price_per_gram_usd, spot.fetched_at, metalChoice);
}

/**
 * Compute every available metal option for a product. Returns one
 * breakdown per option (e.g. 18k yellow, 18k white, 18k rose).
 */
export async function priceAllOptions(
  p: PricingInputs,
  metalsArray: string[]
): Promise<PriceBreakdown[]> {
  const spot = await getGoldSpot();
  const options = availableMetals(metalsArray);
  // If the metals array couldn't be parsed, fall back to default_metal only.
  const keys = options.length > 0
    ? options
    : (p.default_metal ? [p.default_metal] : ['14k_yellow']);
  return keys.map((k) => computePrice(p, spot.price_per_gram_usd, spot.fetched_at, k));
}

export function formatUsd(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
