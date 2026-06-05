/**
 * Stone math helpers for the admin product editor.
 *
 * We auto-fill three fields from the manual inputs (stone_size_mm +
 * stone_count_input):
 *
 *   • carat per stone    — round brilliant approximation
 *   • total carats       — carat per stone × count
 *   • price per carat    — tiered melee/diamond market estimate
 *   • total stone price  — total carats × price per carat
 *
 * The price-per-carat lookup uses an industry-tier table for round
 * brilliants in the SI/VS color range — the same band most DANHOV
 * accent stones fall in. The studio can always override the auto-fill
 * by editing the price/ct number directly.
 */

/**
 * Carat weight of a single round brilliant of the given mm diameter.
 *
 * Formula: ct ≈ 0.0038 × mm³ (assumes ideal cut: depth ≈ 0.62 × dia)
 *
 * Calibration:
 *   3.0 mm → 0.10 ct
 *   4.0 mm → 0.25 ct
 *   5.0 mm → 0.50 ct
 *   6.5 mm → 1.00 ct
 */
export function caratFromMm(mm: number): number {
  if (!Number.isFinite(mm) || mm <= 0) return 0;
  return 0.0038 * Math.pow(mm, 3);
}

/**
 * Tiered $/ct estimate for round brilliant diamonds in the SI/VS color
 * range — calibrated against recent wholesale price lists. The studio
 * can override this number on the editor if a particular lot was priced
 * differently. Numbers are USD per carat.
 */
const PRICE_PER_CT_TIERS: { ct_min: number; price_per_ct_usd: number }[] = [
  { ct_min: 0.000, price_per_ct_usd: 320 },   // < 0.005 ct (under 1 mm)
  { ct_min: 0.005, price_per_ct_usd: 480 },   // ~1 mm
  { ct_min: 0.010, price_per_ct_usd: 620 },   // ~1.4 mm
  { ct_min: 0.030, price_per_ct_usd: 850 },   // ~2 mm
  { ct_min: 0.060, price_per_ct_usd: 1100 },  // ~2.5 mm
  { ct_min: 0.100, price_per_ct_usd: 1500 },  // ~3 mm
  { ct_min: 0.150, price_per_ct_usd: 2100 },  // ~3.5 mm
  { ct_min: 0.250, price_per_ct_usd: 2800 },  // ~4 mm
  { ct_min: 0.400, price_per_ct_usd: 3600 },  // ~4.5 mm
  { ct_min: 0.500, price_per_ct_usd: 4500 },  // ~5 mm
  { ct_min: 0.750, price_per_ct_usd: 6500 },  // ~6 mm
  { ct_min: 1.000, price_per_ct_usd: 9500 },  // ~6.5 mm
  { ct_min: 1.500, price_per_ct_usd: 13000 },
  { ct_min: 2.000, price_per_ct_usd: 18000 },
  { ct_min: 3.000, price_per_ct_usd: 25000 },
];

export function pricePerCaratFromCt(ct: number): number {
  if (!Number.isFinite(ct) || ct <= 0) return 0;
  let chosen = PRICE_PER_CT_TIERS[0].price_per_ct_usd;
  for (const tier of PRICE_PER_CT_TIERS) {
    if (ct >= tier.ct_min) chosen = tier.price_per_ct_usd;
  }
  return chosen;
}

/**
 * Diamond / stone shapes offered in the studio editor. `slug` is what we
 * persist; `label` is the human label shown in the dropdown.
 */
export const DIAMOND_SHAPES: { slug: string; label: string }[] = [
  { slug: 'round', label: 'Round brilliant' },
  { slug: 'princess', label: 'Princess' },
  { slug: 'cushion', label: 'Cushion' },
  { slug: 'oval', label: 'Oval' },
  { slug: 'emerald', label: 'Emerald' },
  { slug: 'pear', label: 'Pear' },
  { slug: 'marquise', label: 'Marquise' },
  { slug: 'asscher', label: 'Asscher' },
  { slug: 'radiant', label: 'Radiant' },
  { slug: 'heart', label: 'Heart' },
  { slug: 'trillion', label: 'Trillion' },
  { slug: 'baguette', label: 'Baguette' },
];

/** One spec'd set of stones on a piece.
 *
 * Stones are measured by length × width (mm). `size_mm` stays for
 * backward-compat — it mirrors the effective diameter (average of length
 * and width) and still drives the carat estimate so existing pricing reads
 * keep working. For a round stone, length == width. */
export type StoneGroup = {
  count: number | null;
  size_mm: number | null;       // effective diameter = (length + width) / 2
  length_mm?: number | null;
  width_mm?: number | null;
  shape: string | null;
};

/** Effective diameter from a group's length/width (falls back to size_mm). */
export function effectiveSizeMm(g: {
  size_mm?: number | null;
  length_mm?: number | null;
  width_mm?: number | null;
}): number | null {
  const l = g.length_mm ?? null;
  const w = g.width_mm ?? null;
  if (l != null && w != null) return (Number(l) + Number(w)) / 2;
  if (l != null) return Number(l);
  if (w != null) return Number(w);
  return g.size_mm ?? null;
}

export type StoneBreakdown = {
  carat_per_stone: number;
  total_carats: number;
  price_per_carat_usd: number;
  total_stone_price_usd: number;
};

export function computeStoneBreakdown(
  stoneSizeMm: number | null | undefined,
  stoneCount: number | null | undefined,
): StoneBreakdown {
  const mm = Number(stoneSizeMm ?? 0);
  const count = Number(stoneCount ?? 0);
  const caratPerStone = caratFromMm(mm);
  const totalCarats = caratPerStone * Math.max(0, count);
  const pricePerCarat = pricePerCaratFromCt(caratPerStone);
  const totalStonePrice = totalCarats * pricePerCarat;
  return {
    carat_per_stone: caratPerStone,
    total_carats: totalCarats,
    price_per_carat_usd: pricePerCarat,
    total_stone_price_usd: totalStonePrice,
  };
}

/**
 * Aggregate breakdown across one or more stone groups. Each group is
 * costed independently (its own mm size drives its $/ct tier) and the
 * carats / dollar totals are summed. `price_per_carat_usd` reflects the
 * blended rate (total price ÷ total carats) so the editor can still show
 * a single headline number.
 */
export function computeStoneGroupsBreakdown(
  groups: StoneGroup[] | null | undefined,
): StoneBreakdown {
  const list = Array.isArray(groups) ? groups : [];
  let totalCarats = 0;
  let totalStonePrice = 0;
  for (const g of list) {
    const b = computeStoneBreakdown(effectiveSizeMm(g ?? {}), g?.count);
    totalCarats += b.total_carats;
    totalStonePrice += b.total_stone_price_usd;
  }
  return {
    carat_per_stone: 0,
    total_carats: totalCarats,
    price_per_carat_usd: totalCarats > 0 ? totalStonePrice / totalCarats : 0,
    total_stone_price_usd: totalStonePrice,
  };
}

/**
 * USD per gram of the finished metal — current-market estimates for the
 * metals DANHOV works in. Used to turn the studio's "weight in platinum"
 * input into a metal-cost component on the total price auto-fill.
 *
 * Numbers are conservative wholesale-with-fabrication baselines; the
 * studio can override the final total via the regular `price_display`
 * field on the editor.
 */
const METAL_PRICE_PER_G_USD: Record<string, number> = {
  platinum: 38,
  '18k_yellow': 62,
  '18k_white': 62,
  '18k_rose': 62,
  '14k_yellow': 48,
  '14k_white': 48,
  '14k_rose': 48,
};

export function metalPricePerGram(metal: string | null | undefined): number {
  if (!metal) return METAL_PRICE_PER_G_USD.platinum;
  return METAL_PRICE_PER_G_USD[metal] ?? METAL_PRICE_PER_G_USD.platinum;
}

/**
 * Weight conversion when the studio specs in platinum but the piece is
 * finished in gold. Platinum is ~10% denser than 14k/18k gold, so a
 * platinum spec weighs ~10% more than the gold equivalent of the same
 * piece. Inverse direction: gold weight = platinum weight / 1.10.
 */
function weightInChosenMetal(platinumWeightG: number, metal: string | null | undefined): number {
  if (!metal || metal === 'platinum') return platinumWeightG;
  return platinumWeightG / 1.10;
}

export type ProductTotalBreakdown = {
  total_carats: number;
  price_per_carat_usd: number;
  total_stone_price_usd: number;
  metal_weight_g: number;
  metal_price_per_g_usd: number;
  metal_cost_usd: number;
  labour_usd: number;
  total_product_price_usd: number;
};

/**
 * Full all-in product price from the four studio inputs:
 *   weightInPlatinumG · stoneCount · stoneSizeMm · labourUsd
 * + the product's default_metal (so we cost the metal correctly).
 *
 * total_product_price_usd = stone cost + metal cost + labour
 *
 * No markup multiplier — the client's spec is that this is the cost
 * baseline; the storefront price (`price_display`) is set separately.
 */
export function computeProductTotal(args: {
  weightInPlatinumG: number | null | undefined;
  defaultMetal: string | null | undefined;
  // Stones: pass `stoneGroups` for multi-group pieces, or the legacy
  // single `stoneSizeMm` / `stoneCount` pair. Groups win when provided.
  stoneGroups?: StoneGroup[] | null;
  stoneSizeMm?: number | null;
  stoneCount?: number | null;
  // Labour: split into jewellery + diamond. The legacy single `labourUsd`
  // still works and is treated as jewellery labour.
  jewelleryLabourUsd?: number | null;
  diamondLabourUsd?: number | null;
  labourUsd?: number | null;
}): ProductTotalBreakdown {
  const stones =
    args.stoneGroups && args.stoneGroups.length > 0
      ? computeStoneGroupsBreakdown(args.stoneGroups)
      : computeStoneBreakdown(args.stoneSizeMm, args.stoneCount);

  const platinumWeight = Number(args.weightInPlatinumG ?? 0);
  const metalWeight = weightInChosenMetal(platinumWeight, args.defaultMetal);
  const pricePerG = metalPricePerGram(args.defaultMetal);
  const metalCost = Math.max(0, metalWeight) * pricePerG;

  const jewellery = Math.max(0, Number(args.jewelleryLabourUsd ?? args.labourUsd ?? 0));
  const diamond = Math.max(0, Number(args.diamondLabourUsd ?? 0));
  const labour = jewellery + diamond;
  const total = stones.total_stone_price_usd + metalCost + labour;

  return {
    total_carats: stones.total_carats,
    price_per_carat_usd: stones.price_per_carat_usd,
    total_stone_price_usd: stones.total_stone_price_usd,
    metal_weight_g: metalWeight,
    metal_price_per_g_usd: pricePerG,
    metal_cost_usd: metalCost,
    labour_usd: labour,
    total_product_price_usd: total,
  };
}
