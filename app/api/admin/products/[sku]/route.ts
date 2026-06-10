import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS = [
  'slug', 'name', 'collection', 'category', 'categories',
  'metals', 'images', 'metal_images', 'price_display', 'description', 'default_metal',
  'gold_weight_g', 'markup_multiplier', 'base_labor_usd', 'diamond_labor_usd',
  'stones_value_usd', 'stone_count_input', 'stone_size_mm', 'stone_groups',
  'setting_multiplier', 'centre_diamond_group', 'centre_multiplier', 'commission_rate',
  'accounting_cost_usd', 'is_active', 'sub_categories',
] as const;

function pickAllowed(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) if (k in input) out[k] = input[k as keyof typeof input];
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: { sku: string } }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sku = decodeURIComponent(params.sku);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const sb = createServiceClient();
  const update = pickAllowed(body);
  // Always touch updated_at via the trigger; nothing to add manually.
  const { error } = await sb.from('products').update(update).eq('sku', sku);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { sku: string } }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sku = decodeURIComponent(params.sku);
  const sb = createServiceClient();
  const { error } = await sb.from('products').delete().eq('sku', sku);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
