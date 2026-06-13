import { supabaseAnon } from '@/lib/supabase/anon';
import { fetchProductsByCategory } from '@/lib/products';
import CategoryGridClient, {
  type EngagementCard,
  type CategoryData,
  type CollectionItem,
  type ProductItem,
} from './CategoryGridClient';

// ── Engagement collection definitions ─────────────────────────────────────

const COLLECTIONS = [
  {
    label: 'Abbraccio',
    value: 'abbraccio',
    meaning: 'The Embrace',
    body: "DANHOV's most iconic swirl settings — the stone held in a spiral embrace of gold.",
    href: '/collection/abbraccio',
  },
  {
    label: 'Voltaggio',
    value: 'voltaggio',
    meaning: 'The Voltage',
    body: 'Tension-set designs where the diamond is suspended by the energy of the ring itself.',
    href: '/collection/voltaggio',
  },
  {
    label: 'Classico',
    value: 'classico',
    meaning: 'The Classic',
    body: 'Timeless solitaire profiles refined over four decades of master craftsmanship in Los Angeles.',
    href: '/collection/classico',
  },
  {
    label: 'Norme de Danhov',
    value: 'norme',
    meaning: 'The Standard',
    body: "Foundational forms that define DANHOV's benchmark for excellence in gold work.",
    href: '/collection/norme',
  },
  {
    label: 'Carezza',
    value: 'carezza',
    meaning: 'The Caress',
    body: 'Delicate pavé and micro-setting work — softness woven into gold, touch made permanent.',
    href: '/collection/carezza',
  },
  {
    label: 'Per Lei',
    value: 'per-lei',
    meaning: 'For Her',
    body: 'Floral forms and feminine geometries, each piece created in devotion for singular women.',
    href: '/collection/per-lei',
  },
  {
    label: 'Petalo',
    value: 'petalo',
    meaning: 'The Petal',
    body: "Nature's most perfect architecture — organic petal forms blooming in 14k and 18k gold.",
    href: '/collection/petalo',
  },
  {
    label: 'Solo Filo',
    value: 'solo',
    meaning: 'Single Thread',
    body: 'A single continuous thread of gold — minimal, essential, unbroken as a promise.',
    href: '/collection/solo',
  },
  {
    label: 'Eleganza',
    value: 'eleganza',
    meaning: 'The Elegance',
    body: 'Refined simplicity. Designs that speak through restraint and perfection of proportion.',
    href: '/collection/eleganza',
  },
  {
    label: 'Couture',
    value: 'couture',
    meaning: 'The Sovereign',
    body: 'Statement pieces with presence. Worn not to become — but to declare what already is.',
    href: '/collection/couture',
  },
  {
    label: 'Unito',
    value: 'unito',
    meaning: 'United',
    body: 'Two forms joined as one. For love that is both distinct and inseparable.',
    href: '/collection/unito',
  },
  {
    label: 'The Life Path',
    value: 'life-path',
    meaning: 'Your Number, Your Sign',
    body: 'Enter the day you arrived. We calculate your life path number and your sign, then create an original design from both — a form no other birth date makes. Not your fate. A mirror.',
    href: '/life-path',
    isLifePath: true,
  },
];

// ── CDN pinned image helpers ───────────────────────────────────────────────

const CDN = 'https://www.danhov.com/media/catalog/product/cache/637ba258c3859c45128cee99e1ea5a62';

const PINNED_SKUS: Record<string, string> = {
  abbraccio: 'AE520UQ-18W',
  couture:   'CE500VQ-18W',
  voltaggio: 'VE508VH-14W',
  classico:  'WE534UH-14W',
};

const CDN_FALLBACKS: Record<string, string> = {
  abbraccio: `${CDN}/a/e/ae520uq_r1_1_wg_1.jpg`,
  couture:   `${CDN}/r/1/r1_wg.jpg`,
  voltaggio: `${CDN}/t/e/tension_rush_2_v122_v2_wg_1.jpg`,
  classico:  `${CDN}/r/i/ring_2__25.png`,
};

// Each card shows only ONE product's image variants — no mixing products across collections.
// Pinned collections prefer the exact pinned SKU; if it has < 2 images, the product
// with the most variants in that collection is used so hover cycling actually works.
async function getCollectionImages(): Promise<Record<string, string[]>> {
  try {
    // 1. Fetch all engagement products in one query (collection + images + sku)
    const { data: all } = await supabaseAnon
      .from('products')
      .select('sku, collection, images')
      .filter('categories', 'cs', JSON.stringify(['engagement']))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const rows = all ?? [];

    // Build a per-collection index: colKey → product with most images
    const bestByCol: Record<string, string[]> = {};
    for (const p of rows) {
      const col = (p.collection as string | null)?.toLowerCase().trim();
      if (!col) continue;
      if (!Array.isArray(p.images) || p.images.length === 0) continue;
      const imgs = (p.images as string[]).slice(0, 8);
      if (!bestByCol[col] || imgs.length > bestByCol[col].length) {
        bestByCol[col] = imgs;
      }
    }

    const map: Record<string, string[]> = {};

    // 2. For pinned collections: prefer the pinned SKU if it has ≥ 2 images,
    //    otherwise fall back to the best product in that collection.
    for (const [colKey, pinnedSku] of Object.entries(PINNED_SKUS)) {
      const pinned = rows.find(
        (p) => (p.sku as string).toLowerCase() === pinnedSku.toLowerCase()
      );
      const pinnedImgs = Array.isArray(pinned?.images) && (pinned!.images as string[]).length >= 2
        ? (pinned!.images as string[]).slice(0, 8)
        : null;

      if (pinnedImgs) {
        map[colKey] = pinnedImgs;
      } else if (bestByCol[colKey]) {
        map[colKey] = bestByCol[colKey];
      } else if (CDN_FALLBACKS[colKey]) {
        map[colKey] = [CDN_FALLBACKS[colKey]];
      }
    }

    // 3. For non-pinned collections use the product with the most images
    const pinnedKeys = new Set(Object.keys(PINNED_SKUS));
    for (const [col, imgs] of Object.entries(bestByCol)) {
      if (!pinnedKeys.has(col) && !map[col]) {
        map[col] = imgs;
      }
    }

    return map;
  } catch {
    return Object.fromEntries(
      Object.entries(CDN_FALLBACKS).map(([k, v]) => [k, [v]])
    );
  }
}

// ── Category data fetching (wedding / fine / mens preview images) ──────────

const NAME_TO_SLUG: Record<string, string> = {
  'abbraccio': 'abbraccio',
  'voltaggio': 'voltaggio',
  'classico': 'classico',
  'norme de danhov': 'norme',
  'carezza': 'carezza',
  'per lei': 'per-lei',
  'petalo': 'petalo',
  'solo filo': 'solo',
  'eleganza': 'eleganza',
  'couture': 'couture',
  'unito': 'unito',
};

const COLLECTION_INFO: Record<string, { meaning: string; body: string }> = {
  abbraccio: { meaning: 'The Embrace', body: "DANHOV's most iconic swirl settings — the stone held in a spiral embrace of gold." },
  voltaggio: { meaning: 'The Voltage', body: 'Tension-set designs where the diamond is suspended by the energy of the ring itself.' },
  classico:  { meaning: 'The Classic', body: 'Timeless solitaire profiles refined over four decades of master craftsmanship in Los Angeles.' },
  norme:     { meaning: 'The Standard', body: "Foundational forms that define DANHOV's benchmark for excellence in gold work." },
  carezza:   { meaning: 'The Caress', body: 'Delicate pavé and micro-setting work — softness woven into gold, touch made permanent.' },
  'per-lei': { meaning: 'For Her', body: 'Floral forms and feminine geometries, each piece created in devotion for singular women.' },
  petalo:    { meaning: 'The Petal', body: "Nature's most perfect architecture — organic petal forms blooming in 14k and 18k gold." },
  solo:      { meaning: 'Single Thread', body: 'A single continuous thread of gold — minimal, essential, unbroken as a promise.' },
  eleganza:  { meaning: 'The Elegance', body: 'Refined simplicity. Designs that speak through restraint and perfection of proportion.' },
  couture:   { meaning: 'The Sovereign', body: 'Statement pieces with presence. Worn not to become — but to declare what already is.' },
  unito:     { meaning: 'United', body: 'Two forms joined as one. For love that is both distinct and inseparable.' },
};

const CATEGORY_FALLBACK: Record<string, (name: string) => string> = {
  wedding: (name) =>
    `${name} wedding bands — handcrafted in 14k and 18k gold in Los Angeles to be worn every day, for life.`,
  fine: (name) =>
    `${name} fine jewelry — gold and diamond pieces built for daily wear and lasting beauty, made to order in Los Angeles.`,
  mens: (name) =>
    `${name} men's collection — bold, precise forms in 14k and 18k gold. Made in Los Angeles for the man who wears with intention.`,
};

async function fetchCategoryData(category: string): Promise<CategoryData> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('collection, images')
      .filter('categories', 'cs', JSON.stringify([category]))
      .eq('is_active', true);

    const imageMap: Record<string, string[]> = {};
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (const product of data ?? []) {
      const col = (product.collection as string | null)?.trim();
      if (!col) continue;
      const key = col.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        ordered.push(col);
      }
      if (Array.isArray(product.images) && product.images.length > 0) {
        if (!imageMap[key]) imageMap[key] = [];
        for (const img of product.images as string[]) {
          if (imageMap[key].length < 6) imageMap[key].push(img);
        }
      }
    }

    const fallbackBody = CATEGORY_FALLBACK[category];
    const collections: CollectionItem[] = ordered
      .map((name): CollectionItem | null => {
        const key = name.toLowerCase();
        const imgs = imageMap[key] ?? [];
        if (imgs.length === 0) return null;
        const slug = NAME_TO_SLUG[key] ?? key.replace(/[^a-z0-9]+/g, '-');
        const info = COLLECTION_INFO[slug] ?? COLLECTION_INFO[key] ?? null;
        return {
          name,
          slug,
          images: imgs,
          meaning: info?.meaning ?? '',
          body: info?.body ?? (fallbackBody ? fallbackBody(name) : ''),
        };
      })
      .filter((c): c is CollectionItem => c !== null);

    if (collections.length > 0) return { collections, products: [] };

    const fallbackProds = await fetchProductsByCategory(category, 8);
    const products: ProductItem[] = fallbackProds.map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      collection: p.collection ?? null,
      images: p.images ?? null,
      price_display: p.price_display ?? null,
    }));
    return { collections: [], products };
  } catch {
    return { collections: [], products: [] };
  }
}

// Extract up to `max` preview images from a category dataset.
function extractPreviewImages(data: CategoryData, exclude: string[] = [], max = 4): string[] {
  const imgs: string[] = [];
  let round = 0;
  while (imgs.length < max) {
    let added = false;
    for (const col of data.collections) {
      const img = col.images[round];
      if (img && !imgs.includes(img) && !exclude.includes(img)) {
        imgs.push(img);
        added = true;
        if (imgs.length >= max) break;
      }
    }
    if (!added) break;
    round++;
  }
  for (const prod of data.products) {
    if (imgs.length >= max) break;
    const img = (prod.images ?? [])[0];
    if (img && !imgs.includes(img) && !exclude.includes(img)) imgs.push(img);
  }
  return imgs;
}

/**
 * For the Wedding / Fine / Men's category cards on the homepage.
 * Per-product: merges metal_images (one per colour) + regular images into a
 * combined pool, then picks the product with the largest combined pool.
 * This guarantees cycling even when metal_images is absent or sparse.
 */
async function fetchCategoryPreviewImages(category: string, exclude: string[] = []): Promise<string[]> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('images, metal_images')
      .filter('categories', 'cs', JSON.stringify([category]))
      .eq('is_active', true);

    if (!data || data.length === 0) return [];

    let bestImages: string[] = [];

    for (const p of data) {
      // Metal variant images: one per colour, sorted platinum→white→yellow→rose
      const metalImgs = (p.metal_images as Record<string, string[]> | null) ?? {};
      const metalKeys = Object.keys(metalImgs)
        .filter(k => (metalImgs[k]?.length ?? 0) > 0)
        .sort((a, b) => {
          const pri = (k: string) =>
            k.includes('plat') ? 0 : k.includes('white') ? 1 : k.includes('yellow') ? 2 : 3;
          return pri(a) - pri(b);
        });
      const variantImages = metalKeys
        .map(k => metalImgs[k][0])
        .filter((img): img is string => !!img && !exclude.includes(img));

      // Regular product images (used to supplement or replace when metal_images is sparse)
      const regularImages = ((p.images as string[]) ?? []).filter(img => !exclude.includes(img));

      // Merge: metal variants first, then fill from regular images (no duplicates, cap at 4)
      const combined = [...variantImages];
      for (const img of regularImages) {
        if (!combined.includes(img) && combined.length < 4) combined.push(img);
      }

      if (combined.length > bestImages.length) bestImages = combined;
    }

    return bestImages.slice(0, 6);
  } catch {
    return [];
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default async function CategoryCardsSection() {
  // Engagement collection images and category preview images run in parallel.
  // Category preview images are sequenced so each card excludes the previous
  // card's primary image — guarantees wedding ≠ fine ≠ mens on display.
  const imageMap = await getCollectionImages();
  const weddingImgs = await fetchCategoryPreviewImages('wedding');
  const fineImgs    = await fetchCategoryPreviewImages('fine',   [weddingImgs[0]].filter(Boolean));
  const mensImgs    = await fetchCategoryPreviewImages('mens',   [weddingImgs[0], fineImgs[0]].filter(Boolean));

  const engagementCards: EngagementCard[] = COLLECTIONS.map((col) => ({
    label: col.label,
    value: col.value,
    meaning: col.meaning,
    body: col.body,
    href: col.href,
    images: col.isLifePath
      ? []
      : imageMap[col.value] ?? imageMap[col.label.toLowerCase()] ?? [],
    linkLabel: col.isLifePath ? 'Find Your Path' : `Explore ${col.label}`,
    isLifePath: col.isLifePath ?? false,
  }));

  const categoryCards: EngagementCard[] = [
    {
      label: 'Wedding Bands',
      value: 'wedding',
      meaning: 'The Unbroken Circle',
      body: 'Two people. One unbroken form. Handcrafted bands made with the same intention as the moment they mark.',
      href: '/wedding-bands',
      images: weddingImgs,
      linkLabel: 'Browse Wedding Bands',
      isLifePath: false,
    },
    {
      label: 'Fine Jewelry',
      value: 'fine',
      meaning: 'The Daily Beautiful',
      body: 'Designed to be worn every day. Small enough to forget. Beautiful enough to remember forever.',
      href: '/fine-jewelry',
      images: fineImgs,
      linkLabel: 'Browse Fine Jewelry',
      isLifePath: false,
    },
    {
      label: "Men's Jewelry",
      value: 'mens',
      meaning: 'The Worn Statement',
      body: 'A ring that carries a name. A band that asks nothing — and says everything.',
      href: '/mens',
      images: mensImgs,
      linkLabel: "Browse Men's Jewelry",
      isLifePath: false,
    },
  ];

  return (
    <section id="engagement-rings" className="categories-section">
      <div className="categories-inner">
        <div className="categories-header">
          <span className="section-eyebrow">The Collections</span>
          <h2 className="section-title">Each name is a signpost</h2>
          <p className="categories-intro">
            For four decades, DANHOV&apos;s collections have carried Italian names.
            Each name was given for a reason. Each piece was made for a meaning.
          </p>
        </div>

        <CategoryGridClient
          engagementCards={[...engagementCards, ...categoryCards]}
        />
      </div>
    </section>
  );
}
