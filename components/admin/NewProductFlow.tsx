'use client';

import ProductEditor from '@/components/admin/ProductEditor';

const BLANK = {
  sku: '',
  slug: '',
  name: '',
  collection: '',
  category: 'engagement',
  categories: ['engagement'] as string[],
  metals: ['platinum','14k_yellow','14k_white','14k_rose','18k_yellow','18k_white','18k_rose'],
  images: [] as string[],
  metal_images: {} as Record<string, string[]>,
  price_display: '',
  description: '',
  default_metal: 'platinum', // always platinum — other metals are derived
  gold_weight_g: null,
  markup_multiplier: 4,
  base_labor_usd: 4,
  diamond_labor_usd: 50,
  stones_value_usd: null,
  stone_count_input: null,
  stone_size_mm: null,
  stone_groups: null,
  setting_multiplier: 4,
  centre_diamond_group: null,
  centre_multiplier: 50,
  commission_rate: 0,
  casting_labor_per_gram: 10,
  accounting_cost_usd: null,
  custom_labor_usd: null,
  labor_extras: null,
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
