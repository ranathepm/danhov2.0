/**
 * Public site search.
 *
 * GET /api/search?q=foo
 *
 * Searches products by name, collection, SKU, and category. Returns up
 * to 12 best matches. Used by the nav search overlay.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) {
    return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const sb = createServiceClient();
  const like = `%${q.replace(/[%_]/g, '')}%`;

  const { data, error } = await sb
    .from('products')
    .select('sku, slug, name, collection, category, images, price_display')
    .eq('is_active', true)
    .or(`name.ilike.${like},collection.ilike.${like},sku.ilike.${like},category.ilike.${like}`)
    .limit(12);

  if (error) {
    console.error('/api/search failed', error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  type ProductRow = {
    sku: string;
    slug: string;
    name: string;
    collection: string | null;
    category: string;
    images: string[] | null;
    price_display: string | null;
  };

  const items = (data as ProductRow[]).map((p) => ({
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    collection: p.collection,
    category: p.category,
    image: p.images?.[0] ?? null,
    price_display: p.price_display,
  }));

  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
  );
}
