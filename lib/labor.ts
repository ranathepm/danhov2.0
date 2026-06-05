/**
 * Labor cost engine — pure compute, safe to import from client OR server.
 *
 * Each labor category has a unit type:
 *   - 'flat'         → applied once per piece
 *   - 'per_stone'    → multiplied by stone count
 *   - 'per_character'→ multiplied by engraving char count
 *
 * And an `applies_to` filter:
 *   - 'all'           → always applies
 *   - 'white_gold'    → only if metal is *_white
 *   - 'engraved_only' → only if `engraving` is non-empty
 *
 * Server-only fetch helper lives in `lib/labor-server.ts`.
 */

export type LaborCategory = {
  id: string;
  slug: string;
  label: string;
  unit_price_usd: number;
  unit: 'flat' | 'per_stone' | 'per_character';
  applies_to: 'all' | 'white_gold' | 'engraved_only';
  position: number;
  is_active: boolean;
  notes: string | null;
};

export type LaborInputs = {
  stone_count: number;
  metal_key: string | null;          // e.g. '14k_white'
  engraving: string | null;
};

export type LaborLine = {
  slug: string;
  label: string;
  unit: string;
  unit_price_usd: number;
  units: number;
  total_usd: number;
};

export type LaborBreakdown = {
  lines: LaborLine[];
  total_usd: number;
};

/**
 * Compute the labor breakdown given categories + inputs. Pure function.
 */
export function computeLabor(
  categories: LaborCategory[],
  inputs: LaborInputs
): LaborBreakdown {
  const isWhiteGold = (inputs.metal_key ?? '').includes('_white');
  const engraving = (inputs.engraving ?? '').trim();
  const hasEngraving = engraving.length > 0;

  const lines: LaborLine[] = [];

  for (const cat of categories) {
    if (cat.applies_to === 'white_gold' && !isWhiteGold) continue;
    if (cat.applies_to === 'engraved_only' && !hasEngraving) continue;

    let units = 1;
    if (cat.unit === 'per_stone') units = Math.max(0, inputs.stone_count ?? 0);
    else if (cat.unit === 'per_character') units = engraving.length;

    if (units <= 0) continue;

    const total = cat.unit_price_usd * units;
    lines.push({
      slug: cat.slug,
      label: cat.label,
      unit: cat.unit,
      unit_price_usd: cat.unit_price_usd,
      units,
      total_usd: Math.round(total * 100) / 100,
    });
  }

  const total_usd = Math.round(lines.reduce((sum, l) => sum + l.total_usd, 0));
  return { lines, total_usd };
}

/**
 * Platinum → gold weight conversion (density ratio).
 * Pure platinum:  21.45 g/cm^3
 * Pure 24k gold:  19.32 g/cm^3
 * Ratio:          ~0.9007
 *
 * We use 0.90 as a simple, slightly-conservative factor across all gold
 * alloys; the casting/finishing cost absorbs the small alloy-density
 * variations.
 */
export const PLATINUM_TO_GOLD_DENSITY = 0.9;

export function platinumToGoldWeightG(platinumWeightG: number): number {
  return Math.round(platinumWeightG * PLATINUM_TO_GOLD_DENSITY * 100) / 100;
}
