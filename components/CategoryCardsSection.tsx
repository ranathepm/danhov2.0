import { supabaseAnon } from '@/lib/supabase/anon';
import CollectionCardClient from './CollectionCardClient';

const LIFE_PATH_SVG = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="40" stroke="#AC3438" strokeWidth="0.5" opacity="0.3" fill="none" />
    <line x1="60" y1="24" x2="60" y2="96" stroke="#AC3438" strokeWidth="0.8" opacity="0.5" />
    <line x1="28" y1="42" x2="92" y2="78" stroke="#AC3438" strokeWidth="0.8" opacity="0.5" />
    <line x1="92" y1="42" x2="28" y2="78" stroke="#AC3438" strokeWidth="0.8" opacity="0.5" />
    <line x1="24" y1="60" x2="96" y2="60" stroke="#AC3438" strokeWidth="0.8" opacity="0.5" />
    <circle cx="60" cy="60" r="14" fill="rgba(172,52,56,0.08)" stroke="#AC3438" strokeWidth="1" />
    <circle cx="60" cy="24" r="2.5" fill="#AC3438" />
    <circle cx="92" cy="78" r="2.5" fill="#AC3438" />
    <circle cx="28" cy="78" r="2.5" fill="#AC3438" />
  </svg>
);

const COLLECTIONS = [
  {
    label: 'Abbraccio',
    value: 'abbraccio',
    meaning: 'The Embrace',
    body: 'DANHOV\'s most iconic swirl settings — the stone held in a spiral embrace of gold.',
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
    body: 'Foundational forms that define DANHOV\'s benchmark for excellence in gold work.',
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
    body: 'Nature\'s most perfect architecture — organic petal forms blooming in 14k and 18k gold.',
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
    customSvg: LIFE_PATH_SVG,
  },
];

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

async function getCollectionImages(): Promise<Record<string, string[]>> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('sku, collection, images')
      .filter('categories', 'cs', JSON.stringify(['engagement']))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const map: Record<string, string[]> = {};
    if (data) {
      for (const product of data) {
        const col = (product.collection as string | null)?.toLowerCase().trim();
        if (col && Array.isArray(product.images) && product.images.length > 0) {
          if (!map[col]) map[col] = [];
          for (const img of product.images as string[]) {
            if (map[col].length < 6) map[col].push(img);
          }
        }
      }
    }

    const { data: pinned } = await supabaseAnon
      .from('products')
      .select('sku, images')
      .in('sku', Object.values(PINNED_SKUS))
      .eq('is_active', true);

    const pinnedBySkuLower = new Map<string, string[]>();
    for (const p of (pinned ?? [])) {
      if (Array.isArray(p.images) && p.images.length > 0) {
        pinnedBySkuLower.set((p.sku as string).toLowerCase(), p.images as string[]);
      }
    }

    for (const [colKey, sku] of Object.entries(PINNED_SKUS)) {
      const dbImages = pinnedBySkuLower.get(sku.toLowerCase());
      const pinnedImgs =
        dbImages && dbImages.length > 0
          ? dbImages
          : CDN_FALLBACKS[colKey]
          ? [CDN_FALLBACKS[colKey]]
          : [];
      if (pinnedImgs.length > 0) {
        const existing = (map[colKey] ?? []).filter((img) => !pinnedImgs.includes(img));
        map[colKey] = [...pinnedImgs, ...existing].slice(0, 6);
      }
    }

    return map;
  } catch {
    return Object.fromEntries(
      Object.entries(CDN_FALLBACKS).map(([k, v]) => [k, [v]])
    );
  }
}

export default async function CategoryCardsSection() {
  const imageMap = await getCollectionImages();

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

        <div className="categories-grid">
          {COLLECTIONS.map((col) => {
            const images =
              'customSvg' in col
                ? []
                : imageMap[col.value] ??
                  imageMap[col.label.toLowerCase()] ??
                  [];

            return (
              <CollectionCardClient
                key={col.value}
                href={col.href}
                images={images}
                label={col.label}
                meaning={col.meaning}
                body={col.body}
                linkLabel={'customSvg' in col ? 'Find Your Path' : `Explore ${col.label}`}
                customSvg={'customSvg' in col ? col.customSvg : undefined}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
