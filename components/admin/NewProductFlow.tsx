'use client';

import ProductEditor from '@/components/admin/ProductEditor';

const BLANK = {
  sku: '',
  slug: '',
  name: '',
  collection: '',
  category: 'engagement',
  categories: ['engagement'] as string[],
  metals: [] as string[],
  images: [] as string[],
  metal_images: {} as Record<string, string[]>,
  price_display: '',
  description: '',
  default_metal: 'platinum',
  gold_weight_g: null,
  markup_multiplier: 2.2,
  base_labor_usd: 4,
  diamond_labor_usd: 50,
  stones_value_usd: null,
  stone_count_input: null,
  stone_size_mm: null,
  stone_groups: null,
  accounting_cost_usd: null,
  is_active: true,
  sub_categories: [] as string[],
};

/**
 * Per the client: the AI draft flow has been removed. New products are
 * created entirely manually — the studio uploads the photo, enters the
 * weight in platinum, the number of stones, the mm size, and the labour,
 * and the editor auto-fills the carat/$/total stone fields from those
 * inputs.
 */
export default function NewProductFlow() {
  return <ProductEditor product={BLANK} isNew />;
}
