/**
 * POST /api/nivoda/warm-stone
 *
 * Called client-side the moment a user selects a diamond in DiamondPicker.
 * Writes the stone data (already in-hand from the search results) into
 * nivoda_stone_cache so the /ring-builder/review page finds it instantly
 * instead of making a fresh Nivoda API call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { offer_id, stone } = body as { offer_id?: unknown; stone?: unknown };

    if (typeof offer_id !== 'string' || !offer_id || !stone) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Sanitize — offer IDs are UUID-like, possibly prefixed with type e.g. "DIAMOND/uuid"
    const safeId = offer_id.replace(/[^A-Za-z0-9-/]/g, '').slice(0, 120);
    if (!safeId) return NextResponse.json({ ok: false }, { status: 400 });

    const sb = createServiceClient();
    await sb.from('nivoda_stone_cache').upsert(
      {
        offer_id: safeId,
        payload: stone as Record<string, unknown>,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'offer_id' }
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Best-effort — never fail the customer flow
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
