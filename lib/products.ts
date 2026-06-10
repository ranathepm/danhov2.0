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
export async function fetchAllActiveProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAnon
    .from('products')
    .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
    .eq('is_active', true)
    .order('sku', { ascending: true });

  if (error) {
    console.error('fetchAllActiveProducts error:', error);
    return [];
  }
  return (data ?? []) as Product[];
}

export async function fetchProductsByCategory(category: string, limit?: number): Promise<Product[]> {
  // JSONB array contains — use explicit `cs` filter with a JSON-stringified value
  let query = supabaseAnon
    .from('products')
    .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
    .filter('categories', 'cs', JSON.stringify([category]))
    .eq('is_active', true)
    .order('sku', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('fetchProductsByCategory error:', error);
    return [];
  }
  return (data ?? []) as Product[];
}

// Collection slug → database display name
const COLLECTION_SLUG_TO_NAME: Record<string, string> = {
  abbraccio:  'Abbraccio',
  voltaggio:  'Voltaggio',
  classico:   'Classico',
  norme:      'Norme de Danhov',
  carezza:    'Carezza',
  'per-lei':  'Per Lei',
  petalo:     'Petalo',
  solo:       'Solo Filo',
  eleganza:   'Eleganza',
  couture:    'Couture',
  unito:      'Unito',
};

/**
 * Fetch ALL active products that belong to a given collection, across
 * every category (engagement, wedding, fine, mens, etc.).
 */
export async function fetchProductsByCollection(collectionSlug: string): Promise<Product[]> {
  const collectionName = COLLECTION_SLUG_TO_NAME[collectionSlug] ?? collectionSlug;

  const { data, error } = await supabaseAnon
    .from('products')
    .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
    .ilike('collection', collectionName)
    .eq('is_active', true)
    .order('sku', { ascending: true });

  if (error) {
    console.error('fetchProductsByCollection error:', error);
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
  default_metal:     string | null;
  gold_weight_g:     number | null;
  markup_multiplier: number | null;
  base_labor_usd:    number | null;
  diamond_labor_usd: number | null;
  stones_value_usd:  number | null;
  stone_groups:      import('@/lib/stone-math').StoneGroup[] | null;
  commission_rate:   number | null;
};

export async function fetchProductWithPricingBySlug(
  slug: string
): Promise<ProductWithPricing | null> {
  const { data, error } = await supabaseAnon
    .from('products')
    .select(
      'sku, slug, name, collection, category, categories, metals, images, metal_images, price_display, sub_categories, is_active, default_metal, gold_weight_g, markup_multiplier, base_labor_usd, diamond_labor_usd, stones_value_usd, stone_groups, commission_rate'
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
 * Fetch related products for a product detail page.
 * Priority: same collection first, then same category to fill remaining slots.
 */
export async function fetchRelatedProducts(
  currentSlug: string,
  collection: string | null,
  category: string,
  limit = 6
): Promise<Product[]> {
  const results: Product[] = [];
  const seen = new Set([currentSlug]);

  if (collection) {
    const { data } = await supabaseAnon
      .from('products')
      .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
      .ilike('collection', collection)
      .eq('is_active', true)
      .neq('slug', currentSlug)
      .limit(limit);

    for (const p of (data ?? []) as Product[]) {
      if (!seen.has(p.slug)) { seen.add(p.slug); results.push(p); }
    }
  }

  if (results.length < limit) {
    const { data } = await supabaseAnon
      .from('products')
      .select('sku, slug, name, collection, category, categories, metals, default_metal, images, metal_images, price_display, sub_categories, is_active')
      .filter('categories', 'cs', JSON.stringify([category]))
      .eq('is_active', true)
      .neq('slug', currentSlug)
      .limit(limit * 2);

    for (const p of (data ?? []) as Product[]) {
      if (!seen.has(p.slug) && results.length < limit) { seen.add(p.slug); results.push(p); }
    }
  }

  return results.slice(0, limit);
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
