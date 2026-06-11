/**
 * GET /api/metal-prices
 *
 * Returns live spot prices and computed alloy cost-per-gram for every metal
 * DANHOV offers. Used by the admin ProductEditor to show live pricing totals
 * without importing server-only modules (pricing.ts, Supabase service client).
 *
 * Response shape:
 * {
 *   gold_per_gram_24k:       number,  // XAU spot, $/g pure 24k gold
 *   platinum_per_gram_spot:  number,  // XPT spot, $/g pure platinum
 *   iridium_per_gram_spot:   number,  // Ir spot (manual), $/g
 *   fetched_at:              string,  // ISO timestamp of most-recent spot
 *   cost_per_gram: {                  // finished alloy cost per gram
 *     platinum:     number,           // (XPT × 0.90) + (Ir × 0.10)  — 900Pt/100Ir
 *     "18k_yellow": number,           // XAU × 0.75 + 3
 *     ...
 *   }
 * }
 */

import { NextResponse } from 'next/server';
import { getAllSpots, metalCostPerGram } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALL_METALS = [
  'platinum',
  '18k_yellow', '18k_white', '18k_rose',
  '14k_yellow', '14k_white', '14k_rose',
] as const;

export async function GET() {
  try {
    const spots = await getAllSpots();
    const { gold: goldSpot, platinum: platSpot, iridium: irSpot } = spots;

    const costPerGram: Record<string, number> = {};
    for (const metal of ALL_METALS) {
      costPerGram[metal] = Math.round(
        metalCostPerGram(
          metal,
          goldSpot.price_per_gram_usd,
          platSpot.price_per_gram_usd,
          irSpot.price_per_gram_usd,
        ) * 100,
      ) / 100;
    }

    const fetchedAt = [goldSpot.fetched_at, platSpot.fetched_at, irSpot.fetched_at]
      .sort()
      .at(-1)!;

    return NextResponse.json(
      {
        gold_per_gram_24k:      Math.round(goldSpot.price_per_gram_usd * 100) / 100,
        platinum_per_gram_spot: Math.round(platSpot.price_per_gram_usd * 100) / 100,
        iridium_per_gram_spot:  Math.round(irSpot.price_per_gram_usd * 100) / 100,
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
