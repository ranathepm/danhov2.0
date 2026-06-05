import { supabaseAnon } from '@/lib/supabase/anon';

export type Product = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  category: string;            // primary category
  categories: string[];        // all listings this product appears in
  metals: string[];            // ['18k Yellow Gold', 'White Gold', ...] — available options
  default_metal: string | null; // e.g. '18k_yellow' — the metal shown in the photo
  images: string[];            // [url, ...] — may be empty (fallback gallery)
  /** Per-metal gallery overrides keyed by metal slug. When a customer
   *  picks a metal swatch, the gallery shows metal_images[that_metal]
   *  if it exists and is non-empty; otherwise it falls back to images. */
  metal_images: Record<string, string[]> | null;
  price_display: string | null;
  sub_categories: string[];    // ['her-bands', 'award-winners', ...]
  is_active: boolean;
};

/**
 * Fetch all products that belong to a given category.
 * Uses the JSONB `categories` array so multi-category products (e.g. unisex
 * wedding bands shown under both /wedding-bands and /mens) show up correctly.
 */
export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  // JSONB array contains — use explicit `cs` filter with a JSON-stringified value
  const { data, error } = await supabaseAnon
    .from('products')
    .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
    .filter('categories', 'cs', JSON.stringify([category]))
    .eq('is_active', true)
    .order('sku', { ascending: true });

  if (error) {
    console.error('fetchProductsByCategory error:', error);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseAnon
    .from('products')
    .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('fetchProductBySlug error:', error);
    return null;
  }
  return (data as Product) ?? null;
}

/**
 * Like fetchProductBySlug, but also pulls the pricing inputs needed by
 * the live-price engine (default_metal, weights, markup, labor, stones).
 * Use from server-side code that needs to compute today's price.
 */
export type ProductWithPricing = Product & {
  default_metal: string | null;
  gold_weight_g: number | null;
  markup_multiplier: number | null;
  base_labor_usd: number | null;
  diamond_labor_usd: number | null;
  stones_value_usd: number | null;
};

export async function fetchProductWithPricingBySlug(
  slug: string
): Promise<ProductWithPricing | null> {
  const { data, error } = await supabaseAnon
    .from('products')
    .select(
      'sku, slug, name, collection, category, categories, metals, images, metal_images, price_display, sub_categories, is_active, default_metal, gold_weight_g, markup_multiplier, base_labor_usd, diamond_labor_usd, stones_value_usd'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('fetchProductWithPricingBySlug error:', error);
    return null;
  }
  return (data as ProductWithPricing) ?? null;
}

/**
 * Derive a filter slug from the display collection name using the
 * page's collections list (e.g. "Norme de Danhov" → "norme").
 */
export function collectionToSlug(
  displayName: string | null,
  collections: { label: string; value: string }[]
): string | null {
  if (!displayName) return null;
  const lower = displayName.toLowerCase();
  return (
    collections.find((c) => c.label.toLowerCase() === lower)?.value ?? null
  );
}
