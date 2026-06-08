import Link from 'next/link';
import Image from 'next/image';
import { supabaseAnon } from '@/lib/supabase/anon';

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
  abbraccio: {
    meaning: 'The Embrace',
    body: "DANHOV's most iconic swirl settings — the stone held in a spiral embrace of gold.",
  },
  voltaggio: {
    meaning: 'The Voltage',
    body: 'Tension-set designs where the diamond is suspended by the energy of the ring itself.',
  },
  classico: {
    meaning: 'The Classic',
    body: 'Timeless solitaire profiles refined over four decades of master craftsmanship in Los Angeles.',
  },
  norme: {
    meaning: 'The Standard',
    body: "Foundational forms that define DANHOV's benchmark for excellence in gold work.",
  },
  carezza: {
    meaning: 'The Caress',
    body: 'Delicate pavé and micro-setting work — softness woven into gold, touch made permanent.',
  },
  'per-lei': {
    meaning: 'For Her',
    body: 'Floral forms and feminine geometries, each piece created in devotion for singular women.',
  },
  petalo: {
    meaning: 'The Petal',
    body: "Nature's most perfect architecture — organic petal forms blooming in 14k and 18k gold.",
  },
  solo: {
    meaning: 'Single Thread',
    body: 'A single continuous thread of gold — minimal, essential, unbroken as a promise.',
  },
  eleganza: {
    meaning: 'The Elegance',
    body: 'Refined simplicity. Designs that speak through restraint and perfection of proportion.',
  },
  couture: {
    meaning: 'The Sovereign',
    body: 'Statement pieces with presence. Worn not to become — but to declare what already is.',
  },
  unito: {
    meaning: 'United',
    body: 'Two forms joined as one. For love that is both distinct and inseparable.',
  },
};

type CollectionCard = {
  name: string;
  slug: string;
  image: string | null;
  meaning: string;
  body: string;
};

async function fetchCollections(category: string): Promise<CollectionCard[]> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('collection, images')
      .filter('categories', 'cs', JSON.stringify([category]))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const imageMap: Record<string, string> = {};
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
      if (!imageMap[key] && Array.isArray(product.images) && product.images.length > 0) {
        imageMap[key] = product.images[0];
      }
    }

    return ordered
      .map((name): CollectionCard | null => {
        const slug = NAME_TO_SLUG[name.toLowerCase()];
        if (!slug) return null;
        const info = COLLECTION_INFO[slug];
        if (!info) return null;
        return {
          name,
          slug,
          image: imageMap[name.toLowerCase()] ?? null,
          meaning: info.meaning,
          body: info.body,
        };
      })
      .filter((c): c is CollectionCard => c !== null);
  } catch {
    return [];
  }
}

type Props = {
  id: string;
  category: string;
  eyebrow: string;
  title: string;
  intro: string;
  viewAllHref: string;
  viewAllLabel: string;
};

export default async function CollectionSection({
  id,
  category,
  eyebrow,
  title,
  intro,
  viewAllHref,
  viewAllLabel,
}: Props) {
  const collections = await fetchCollections(category);

  return (
    <section id={id} className="categories-section">
      <div className="categories-inner">
        <div className="categories-header">
          <span className="section-eyebrow">{eyebrow}</span>
          <h2 className="section-title">{title}</h2>
          <p className="categories-intro">{intro}</p>
        </div>

        {collections.length > 0 ? (
          <div className="categories-grid">
            {collections.map((col) => (
              <Link key={col.slug} href={`/collection/${col.slug}`} className="cat-card">
                <div className="cat-photo">
                  {col.image ? (
                    <Image
                      src={col.image}
                      alt={`${col.name} by DANHOV`}
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
                  <span className="cat-eyebrow">{col.name}</span>
                  <p className="cat-meaning">{col.meaning}</p>
                  <p className="cat-body">{col.body}</p>
                  <span className="cat-link">Explore {col.name} &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="categories-intro" style={{ textAlign: 'center', marginTop: 0 }}>
            Explore our full collection below.
          </p>
        )}

        <div className="col-section-cta">
          <Link href={viewAllHref} className="btn-solid">{viewAllLabel}</Link>
        </div>
      </div>
    </section>
  );
}
