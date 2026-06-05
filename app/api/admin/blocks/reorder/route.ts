import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/blocks/reorder
 *   { page_slug: 'home', order: [<block-id>, <block-id>, …] }
 *
 * Sets each block's `position` to its index in the array. All blocks
 * for the page must be present in the array (in their new order).
 */
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { page_slug?: string; order?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.page_slug || !Array.isArray(body.order)) {
    return NextResponse.json({ error: 'page_slug + order required' }, { status: 400 });
  }

  const sb = createServiceClient();
  // PostgREST has no native bulk-update-by-id, so issue them sequentially
  // — small N (≤ a few dozen per page) makes this fine.
  for (let i = 0; i < body.order.length; i++) {
    const id = body.order[i];
    const { error } = await sb
      .from('page_blocks')
      .update({ position: i })
      .eq('id', id)
      .eq('page_slug', body.page_slug);
    if (error) {
      return NextResponse.json({ error: error.message, failed_at: id }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
