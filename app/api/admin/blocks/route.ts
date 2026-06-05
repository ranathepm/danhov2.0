import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { BLOCK_DEFAULTS, type BlockType } from '@/lib/blocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TYPES = new Set([
  'heading', 'paragraph', 'image', 'video', 'cta', 'quote', 'divider', 'spacer',
]);

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    page_slug?: string;
    type?: BlockType;
    position?: number;
    data?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.page_slug || !body.type || !VALID_TYPES.has(body.type)) {
    return NextResponse.json({ error: 'page_slug + valid type required' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Default position = end of the page
  let position = body.position;
  if (position === undefined) {
    const { data: existing } = await sb
      .from('page_blocks')
      .select('position')
      .eq('page_slug', body.page_slug)
      .order('position', { ascending: false })
      .limit(1);
    position = existing && existing.length > 0 ? Number(existing[0].position) + 1 : 0;
  }

  const data = { ...BLOCK_DEFAULTS[body.type], ...(body.data ?? {}) };

  const { data: row, error } = await sb
    .from('page_blocks')
    .insert({
      page_slug: body.page_slug,
      type: body.type,
      position,
      data,
      is_visible: true,
    })
    .select('id, page_slug, position, type, data, is_visible')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(row);
}
