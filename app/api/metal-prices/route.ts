/**
 * GET /api/metal-prices
 *
 * Returns live spot prices and computed alloy cost-per-gram for every metal
 * DANHOV offers. Used by the admin ProductEditor to show live pricing totals
 * without importing server-only modules (pricing.ts, Supabase service client).
 *
 * Response shape:
 * {
 *   gold_per_gram_24k:      number,   // XAU spot, $/g pure 24k gold
 *   platinum_per_gram_spot: number,   // XPT spot, $/g pure platinum
 *   fetched_at:             string,   // ISO timestamp of more-recent spot
 *   cost_per_gram: {                  // finished alloy cost (material + alloy metals)
 *     platinum:     number,           // XPT × 0.95
 *     "18k_yellow": number,           // XAU × 0.75 + 3
 *     "18k_white":  number,
 *     "18k_rose":   number,
 *     "14k_yellow": number,           // XAU × 0.5833 + 3
 *     "14k_white":  number,
 *     "14k_rose":   number,
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { getGoldSpot, getPlatinumSpot, metalCostPerGram } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALL_METALS = [
  'platinum',
  '18k_yellow', '18k_white', '18k_rose',
  '14k_yellow', '14k_white', '14k_rose',
] as const;

export async function GET() {
  try {
    const [goldSpot, platSpot] = await Promise.all([getGoldSpot(), getPlatinumSpot()]);

    const costPerGram: Record<string, number> = {};
    for (const metal of ALL_METALS) {
      costPerGram[metal] = Math.round(
        metalCostPerGram(metal, goldSpot.price_per_gram_usd, platSpot.price_per_gram_usd) * 100,
      ) / 100;
    }

    // Expose the more recent of the two timestamps
    const fetchedAt =
      new Date(goldSpot.fetched_at) >= new Date(platSpot.fetched_at)
        ? goldSpot.fetched_at
        : platSpot.fetched_at;

    return NextResponse.json(
      {
        gold_per_gram_24k:      Math.round(goldSpot.price_per_gram_usd * 100) / 100,
        platinum_per_gram_spot: Math.round(platSpot.price_per_gram_usd * 100) / 100,
        fetched_at:             fetchedAt,
        cost_per_gram:          costPerGram,
      },
      {
        headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' },
      },
    );
  } catch (err) {
    console.error('metal-prices error:', err);
    return NextResponse.json(
      { error: 'Live metal prices unavailable' },
      { status: 503 },
    );
  }
}
