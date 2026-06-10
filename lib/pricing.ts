/**
 * Pricing engine — Phase 3.
 *
 * Supports platinum (Pt950) and all 14k/18k gold alloy variants.
 *
 * Formula per metal variant:
 *   metalWeight   = platinumSpecWeight × DENSITY_RATIO[metal]
 *   metalCostPerG = spot × purity  +  alloyCost   (gold)
 *                 = platSpot × 0.95               (platinum)
 *   metalCost     = metalWeight × metalCostPerG
 *   labour        = base_labor_usd + diamond_labor_usd
 *   stones        = stones_value_usd  (or auto from stone_groups if null)
 *   rhodium       = per-metal rhodium plating uplift (white gold only)
 *   subTotal      = metalCost + labour + stones + rhodium
 *   commission    = subTotal × (commission_rate / 100)
 *   total         = subTotal + commission
 *
 * Spot prices:
 *   Gold (XAU)     → GoldAPI /XAU/USD → price_gram_24k (USD per gram, 24k pure)
 *   Platinum (XPT) → GoldAPI /XPT/USD → price per troy oz ÷ 31.1035 = USD/g
 *
 * Both spots cached in metal_prices table (2-hour TTL on paid GoldAPI tier).
 */

import { createServiceClient } from '@/lib/supabase/server';
import { computeStoneGroupsBreakdown, type StoneGroup } from '@/lib/stone-math';

const GOLDAPI_BASE   = 'https://www.goldapi.io/api';
const OUNCE_TO_GRAMS = 31.1035;

// ── Metal constants ───────────────────────────────────────────────────────────

/**
 * Density ratio: alloy_density / platinum_density.
 * Studio specs weight in platinum grams; multiply by this ratio to get the
 * actual weight of the same piece made in the chosen alloy.
 *
 * Reference densities (g/cm³):
 *   Platinum 950 : 21.45   (base — ratio = 1.0)
 *   18k Yellow   : 15.50   → 0.7228
 *   18k White    : 14.70   → 0.6853
 *   18k Rose     : 15.20   → 0.7088
 *   14k Yellow   : 13.10   → 0.6108
 *   14k White    : 12.90   → 0.6014
 *   14k Rose     : 13.10   → 0.6108
 */
export const DENSITY_RATIO: Record<string, number> = {
  platinum:     1.0000,
  '18k_yellow': 0.7228,
  '18k_white':  0.6853,
  '18k_rose':   0.7088,
  '14k_yellow': 0.6108,
  '14k_white':  0.6014,
  '14k_rose':   0.6108,
};

// Gold purity (fraction of pure gold in the alloy)
const GOLD_PURITY: Record<string, number> = {
  '18k_yellow': 0.7500,
  '18k_white':  0.7500,
  '18k_rose':   0.7500,
  '14k_yellow': 0.5833,
  '14k_white':  0.5833,
  '14k_rose':   0.5833,
};

// Platinum alloy purity (Pt950 standard for jewelry)
const PT_PURITY = 0.95;

// Base alloy cost per gram (silver, copper, palladium, etc. in the gold alloy)
const ALLOY_COST_PER_G = 3;

// Rhodium plating uplift for white-gold variants (one-time finishing cost, USD)
export const RHODIUM_UPLIFT: Record<string, number> = {
  '14k_white': 60,
  '18k_white': 80,
};

export const METAL_LABEL: Record<string, string> = {
  platinum:     'Platinum',
  '14k_yellow': '14k Yellow Gold',
  '14k_white':  '14k White Gold',
  '14k_rose':   '14k Rose Gold',
  '18k_yellow': '18k Yellow Gold',
  '18k_white':  '18k White Gold',
  '18k_rose':   '18k Rose Gold',
};

// Legacy alias
export const PURITY_LABEL = METAL_LABEL;

// ── Spot price types and cache layer ─────────────────────────────────────────

export type SpotPrice = {
  price_per_gram_usd: number;
  fetched_at: string;
};

export type AllSpots = {
  gold: SpotPrice;
  platinum: SpotPrice;
};

async function fetchSpot(
  metalCode: 'XAU' | 'XPT',
  cacheKey: 'gold' | 'platinum',
): Promise<SpotPrice> {
  const client  = createServiceClient();
  const cutoff  = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: cached } = await client
    .from('metal_prices')
    .select('price_per_gram_usd, fetched_at')
    .eq('metal', cacheKey)
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

  const token = process.env.GOLDAPI_TOKEN;
  if (!token) throw new Error('GOLDAPI_TOKEN missing');

  const res = await fetch(`${GOLDAPI_BASE}/${metalCode}/USD`, {
    headers: { 'x-access-token': token, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Fall back to any stale row rather than failing completely
    const { data: anyOld } = await client
      .from('metal_prices')
      .select('price_per_gram_usd, fetched_at')
      .eq('metal', cacheKey)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (anyOld) {
      return {
        price_per_gram_usd: Number(anyOld.price_per_gram_usd),
        fetched_at: anyOld.fetched_at as string,
      };
    }
    throw new Error(`GoldAPI ${metalCode} failed (${res.status}) — no cache available`);
  }

  const payload = (await res.json()) as { price?: number; price_gram_24k?: number };
  const perGram =
    typeof payload.price_gram_24k === 'number'
      ? payload.price_gram_24k
      : (payload.price ?? 0) / OUNCE_TO_GRAMS;

  if (!perGram || perGram <= 0) {
    throw new Error(`GoldAPI ${metalCode} returned an invalid price`);
  }

  await client.from('metal_prices').insert({
    metal:              cacheKey,
    price_per_gram_usd: perGram,
    source:             'goldapi',
  });

  return { price_per_gram_usd: perGram, fetched_at: new Date().toISOString() };
}

export async function getGoldSpot(): Promise<SpotPrice> {
  return fetchSpot('XAU', 'gold');
}

export async function getPlatinumSpot(): Promise<SpotPrice> {
  return fetchSpot('XPT', 'platinum');
}

/** Fetch both gold and platinum spots in parallel (shared cache). */
export async function getAllSpots(): Promise<AllSpots> {
  const [gold, platinum] = await Promise.all([getGoldSpot(), getPlatinumSpot()]);
  return { gold, platinum };
}

// ── Metal cost helpers (pure, no DB) ─────────────────────────────────────────

/** USD per gram of finished alloy at given spot prices. */
export function metalCostPerGram(
  metalKey: string,
  goldSpot: number,
  platSpot: number,
): number {
  if (metalKey === 'platinum') return platSpot * PT_PURITY;
  const purity = GOLD_PURITY[metalKey] ?? 0.5833;
  return goldSpot * purity + ALLOY_COST_PER_G;
}

/** Actual physical weight of the piece in `metalKey`, given platinum spec weight. */
export function metalWeightFromPlat(platinumWeightG: number, metalKey: string): number {
  return platinumWeightG * (DENSITY_RATIO[metalKey] ?? 1.0);
}

// ── Pricing inputs / outputs ──────────────────────────────────────────────────

export type PricingInputs = {
  default_metal:      string | null;
  gold_weight_g:      number | null;          // weight spec'd in platinum grams
  base_labor_usd:     number | null;          // setting labour
  diamond_labor_usd?: number | null;          // centre-diamond setting labour
  stones_value_usd:   number | null;          // override; null → auto from stone_groups
  stone_groups?:      StoneGroup[] | null;    // used when stones_value_usd is null
  commission_rate?:   number | null;          // % added to sub-total (e.g. 20 = +20 %)
  markup_multiplier?: number | null;          // legacy field — ignored
};

export type PriceBreakdown = {
  total_usd:             number;
  metal_cost_usd:        number;
  metal_with_markup_usd: number;  // legacy alias = metal_cost_usd
  labor_usd:             number;
  stones_usd:            number;
  rhodium_uplift_usd:    number;
  commission_usd:        number;
  metal_used:            string;
  metal_label:           string;
  spot_per_gram_usd:     number;
  spot_fetched_at:       string;
};

/**
 * Parse a product's metals array into canonical metal keys.
 * Handles both stored keys ('14k_yellow') and display names ('14k Yellow Gold').
 */
export function availableMetals(metals: string[]): string[] {
  if (!metals || metals.length === 0) return [];
  const ALL_KEYS = new Set(Object.keys(DENSITY_RATIO));
  return metals
    .map((m) => m.toLowerCase().trim().replace(/\s+/g, '_'))
    .filter((m) => ALL_KEYS.has(m));
}

/**
 * Pure compute — no DB or network.
 * Pass spots from getAllSpots().
 */
export function computePrice(
  p: PricingInputs,
  spots: AllSpots,
  metalChoice?: string | null,
): PriceBreakdown {
  const metalKey =
    metalChoice && DENSITY_RATIO[metalChoice]
      ? metalChoice
      : p.default_metal && DENSITY_RATIO[p.default_metal]
      ? p.default_metal
      : '14k_yellow';

  const platWeight  = p.gold_weight_g ?? 0;
  const metalWeight = metalWeightFromPlat(platWeight, metalKey);
  const costPerG    = metalCostPerGram(metalKey, spots.gold.price_per_gram_usd, spots.platinum.price_per_gram_usd);
  const metalCost   = metalWeight * costPerG;
  const rhodium     = RHODIUM_UPLIFT[metalKey] ?? 0;
  const labor       = (p.base_labor_usd ?? 0) + (p.diamond_labor_usd ?? 0);

  // Stone cost: use override if set, else auto-compute from stone_groups
  let stones = p.stones_value_usd ?? null;
  if (stones == null) {
    if (Array.isArray(p.stone_groups) && p.stone_groups.length > 0) {
      stones = computeStoneGroupsBreakdown(p.stone_groups).total_stone_price_usd;
    } else {
      stones = 0;
    }
  }

  const subTotal   = metalCost + labor + stones + rhodium;
  const commRate   = p.commission_rate ?? 0;
  const commission = subTotal * (commRate / 100);
  const total      = subTotal + commission;

  const isPlatinum = metalKey === 'platinum';

  return {
    total_usd:             Math.round(total),
    metal_cost_usd:        Math.round(metalCost * 100) / 100,
    metal_with_markup_usd: Math.round(metalCost),
    labor_usd:             labor,
    stones_usd:            Math.round(stones),
    rhodium_uplift_usd:    rhodium,
    commission_usd:        Math.round(commission),
    metal_used:            metalKey,
    metal_label:           METAL_LABEL[metalKey] ?? metalKey,
    spot_per_gram_usd:     Math.round(
      (isPlatinum
        ? spots.platinum.price_per_gram_usd
        : spots.gold.price_per_gram_usd
      ) * 100,
    ) / 100,
    spot_fetched_at: isPlatinum
      ? spots.platinum.fetched_at
      : spots.gold.fetched_at,
  };
}

/** Full pipeline: fetch today's spots and compute one metal variant. */
export async function priceProduct(
  p: PricingInputs,
  metalChoice?: string | null,
): Promise<PriceBreakdown> {
  const spots = await getAllSpots();
  return computePrice(p, spots, metalChoice);
}

/** Compute every available metal option for a product. */
export async function priceAllOptions(
  p: PricingInputs,
  metalsArray: string[],
): Promise<PriceBreakdown[]> {
  const spots   = await getAllSpots();
  const options = availableMetals(metalsArray);
  const keys    = options.length > 0
    ? options
    : p.default_metal && DENSITY_RATIO[p.default_metal]
    ? [p.default_metal]
    : ['14k_yellow'];
  return keys.map((k) => computePrice(p, spots, k));
}

export function formatUsd(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
