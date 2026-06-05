import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import type { LaborCategory, LaborInputs, LaborBreakdown } from '@/lib/labor';
import { computeLabor } from '@/lib/labor';

/**
 * Fetch active labor categories from Supabase. Server-only.
 */
export async function fetchLaborCategories(): Promise<LaborCategory[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('labor_categories')
    .select('id, slug, label, unit_price_usd, unit, applies_to, position, is_active, notes')
    .eq('is_active', true)
    .order('position', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    label: r.label as string,
    unit_price_usd: Number(r.unit_price_usd ?? 0),
    unit: (r.unit as LaborCategory['unit']) ?? 'flat',
    applies_to: (r.applies_to as LaborCategory['applies_to']) ?? 'all',
    position: Number(r.position ?? 0),
    is_active: Boolean(r.is_active),
    notes: (r.notes as string | null) ?? null,
  }));
}

/**
 * Full pipeline: fetch + compute. Used server-side.
 */
export async function computeLaborFor(inputs: LaborInputs): Promise<LaborBreakdown> {
  const cats = await fetchLaborCategories();
  return computeLabor(cats, inputs);
}
