import Link from 'next/link';
import Image from 'next/image';
import { supabaseAnon } from '@/lib/supabase/anon';

const COLLECTIONS = [
  {
    label: 'Abbraccio',
    value: 'abbraccio',
    meaning: 'The Embrace',
    body: 'DANHOV\'s most iconic swirl settings — the stone held in a spiral embrace of gold.',
  },
  {
    label: 'Voltaggio',
    value: 'voltaggio',
    meaning: 'The Voltage',
    body: 'Tension-set designs where the diamond is suspended by the energy of the ring itself.',
  },
  {
    label: 'Classico',
    value: 'classico',
    meaning: 'The Classic',
    body: 'Timeless solitaire profiles refined over four decades of master craftsmanship in Los Angeles.',
  },
  {
    label: 'Norme de Danhov',
    value: 'norme',
    meaning: 'The Standard',
    body: 'Foundational forms that define DANHOV\'s benchmark for excellence in gold work.',
  },
  {
    label: 'Carezza',
    value: 'carezza',
    meaning: 'The Caress',
    body: 'Delicate pavé and micro-setting work — softness woven into gold, touch made permanent.',
  },
  {
    label: 'Per Lei',
    value: 'per-lei',
    meaning: 'For Her',
    body: 'Floral forms and feminine geometries, each piece created in devotion for singular women.',
  },
  {
    label: 'Petalo',
    value: 'petalo',
    meaning: 'The Petal',
    body: 'Nature\'s most perfect architecture — organic petal forms blooming in 14k and 18k gold.',
  },
  {
    label: 'Solo Filo',
    value: 'solo',
    meaning: 'Single Thread',
    body: 'A single continuous thread of gold — minimal, essential, unbroken as a promise.',
  },
  {
    label: 'Eleganza',
    value: 'eleganza',
    meaning: 'The Elegance',
    body: 'Refined simplicity. Designs that speak through restraint and perfection of proportion.',
  },
  {
    label: 'Couture',
    value: 'couture',
    meaning: 'The Sovereign',
    body: 'Statement pieces with presence. Worn not to become — but to declare what already is.',
  },
  {
    label: 'Unito',
    value: 'unito',
    meaning: 'United',
    body: 'Two forms joined as one. For love that is both distinct and inseparable.',
  },
];

async function getCollectionImages(): Promise<Record<string, string>> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('collection, images')
      .filter('categories', 'cs', JSON.stringify(['engagement']))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const map: Record<string, string> = {};
    if (!data) return map;

    for (const product of data) {
      const col = (product.collection as string | null)?.toLowerCase().trim();
      if (col && Array.isArray(product.images) && product.images.length > 0 && !map[col]) {
        map[col] = product.images[0];
      }
    }
    return map;
  } catch {
    return {};
  }
}

export default async function CategoryCardsSection() {
  const imageMap = await getCollectionImages();

  return (
    <section className="categories-section">
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
              imageMap[col.value] ||
              imageMap[col.label.toLowerCase()] ||
              null;

            return (
              <Link
                key={col.value}
                href={`/engagement-rings?collection=${col.value}`}
                className="cat-card"
              >
                <div className="cat-photo">
                  {imgSrc ? (
                    <Image
                      src={imgSrc}
                      alt={`${col.label} engagement ring by DANHOV`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      style={{ objectFit: 'contain', padding: '16px' }}
                    />
                  ) : (
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                      <circle cx="40" cy="40" r="30" stroke="#b8923a" strokeWidth="5" fill="none" />
                      <circle cx="40" cy="26" r="5" fill="rgba(184,146,58,0.2)" stroke="#b8923a" strokeWidth="0.5" />
                    </svg>
                  )}
                </div>
                <div className="cat-info">
                  <span className="cat-eyebrow">{col.label}</span>
                  <p className="cat-meaning">{col.meaning}</p>
                  <p className="cat-body">{col.body}</p>
                  <span className="cat-link">Explore {col.label} &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
