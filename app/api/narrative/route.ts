import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchProductBySlug } from '@/lib/products';
import {
  getOrGenerateNarrative,
  type Occasion,
  OCCASIONS,
} from '@/lib/narratives';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Query = z.object({
  slug: z.string().min(1).max(120),
  occasion: z.enum([
    'engagement',
    'wedding',
    'anniversary',
    'self-love',
    'sacred-union',
    'just-because',
  ]),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = Query.safeParse({
    slug: url.searchParams.get('slug'),
    occasion: url.searchParams.get('occasion'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid params',
        valid_occasions: OCCASIONS.map((o) => o.value),
      },
      { status: 400 }
    );
  }

  const product = await fetchProductBySlug(parsed.data.slug);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const narrative = await getOrGenerateNarrative(
    product,
    parsed.data.occasion as Occasion
  );

  return NextResponse.json(narrative, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
