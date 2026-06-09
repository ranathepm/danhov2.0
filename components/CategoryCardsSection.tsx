import Link from 'next/link';
import Image from 'next/image';
import { supabaseAnon } from '@/lib/supabase/anon';

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

// Exact SKUs for the hero product shown on each collection card.
// When the DB has images for these SKUs those take priority; CDN URLs below are fallbacks.
const PINNED_SKUS: Record<string, string> = {
  abbraccio: 'AE520UQ-18W',  // Danhov Abbraccio Swirl Diamond Ring, 18k White Gold
  couture:   'CE500VQ-18W',  // Danhov Couture Engagement Ring, 18k White Gold
  voltaggio: 'VE508VH-14W',  // Danhov Tension Engagement Ring, 14k White Gold
  classico:  'WE534UH-14W',  // Danhov Classico Ring, 14k White Gold
};

// CDN fallbacks — used when the exact DB product has no images stored.
const CDN_FALLBACKS: Record<string, string> = {
  abbraccio: `${CDN}/a/e/ae520uq_r1_1_wg_1.jpg`,
  couture:   `${CDN}/r/1/r1_wg.jpg`,
  voltaggio: `${CDN}/t/e/tension_rush_2_v122_v2_wg_1.jpg`,
  classico:  `${CDN}/r/i/ring_2__25.png`,
};

async function getCollectionImages(): Promise<Record<string, string>> {
  try {
    // Step 1 — Pull first image per collection for non-pinned collections.
    const { data } = await supabaseAnon
      .from('products')
      .select('sku, collection, images')
      .filter('categories', 'cs', JSON.stringify(['engagement']))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const map: Record<string, string> = {};
    if (data) {
      for (const product of data) {
        const col = (product.collection as string | null)?.toLowerCase().trim();
        if (col && Array.isArray(product.images) && product.images.length > 0 && !map[col]) {
          map[col] = product.images[0];
        }
      }
    }

    // Step 2 — Exact SKU lookup for pinned products.
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

    // Step 3 — Override map with pinned image (DB first, CDN fallback second).
    for (const [colKey, sku] of Object.entries(PINNED_SKUS)) {
      const dbImages = pinnedBySkuLower.get(sku.toLowerCase());
      if (dbImages && dbImages.length > 0) {
        map[colKey] = dbImages[0];
      } else {
        map[colKey] = CDN_FALLBACKS[colKey] ?? map[colKey];
      }
    }

    return map;
  } catch {
    return { ...CDN_FALLBACKS };
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
            const imgSrc =
              'customSvg' in col
                ? null
                : imageMap[col.value] || imageMap[col.label.toLowerCase()] || null;

            return (
              <Link
                key={col.value}
                href={col.href}
                className="cat-card"
              >
                <div className="cat-photo">
                  {'customSvg' in col ? (
                    <div className="cat-photo-placeholder">{col.customSvg}</div>
                  ) : imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={`${col.label} engagement ring by DANHOV`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: 'contain', padding: '12px', mixBlendMode: 'multiply' }}
                    />
                  ) : (
                    <div className="cat-photo-placeholder">
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                        <circle cx="40" cy="40" r="30" stroke="#AC3438" strokeWidth="5" fill="none" />
                        <circle cx="40" cy="26" r="5" fill="rgba(172,52,56,0.12)" stroke="#AC3438" strokeWidth="0.5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="cat-info">
                  <span className="cat-eyebrow">{col.label}</span>
                  <p className="cat-meaning">{col.meaning}</p>
                  <p className="cat-body">{col.body}</p>
                  <span className="cat-link">
                    {'customSvg' in col ? 'Find Your Path' : `Explore ${col.label}`} &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
