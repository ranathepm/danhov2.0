import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { fetchProductsByCategory } from '@/lib/products';
import BuilderStepper from '@/components/BuilderStepper';
import '../builder.css';

export const metadata: Metadata = {
  title: 'Select Your Ring · Ring Builder',
  description:
    "Choose your DANHOV engagement-ring setting. Browse 67 handcrafted settings — filter by collection, metal, and shape — then add your diamond.",
  alternates: { canonical: '/ring-builder/setting' },
};

export const revalidate = 300;

const METAL_COLORS: Record<string, string> = {
  '14k-yellow': '#D4A843',
  '18k-yellow': '#C49A2A',
  '14k-white': '#C8C8C8',
  '18k-white': '#B0B0B0',
  '14k-rose': '#C98080',
  '18k-rose': '#BF6E6E',
  yellow: '#D4A843',
  white: '#C8C8C8',
  rose: '#C98080',
};

type Search = { setting?: string; diamond?: string; collection?: string };

export default async function SelectRingPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const products = await fetchProductsByCategory('engagement');
  const selectedSlug = searchParams.setting;
  const diamondId = searchParams.diamond;
  const activeCollection = searchParams.collection ?? 'all';

  // Build unique sorted collection list
  const allCollections = Array.from(
    new Set(products.map((p) => p.collection).filter(Boolean))
  ).sort() as string[];

  // Filter by collection if one is chosen
  const filtered =
    activeCollection === 'all'
      ? products
      : products.filter(
          (p) => p.collection?.toLowerCase() === activeCollection.toLowerCase()
        );

  // Group by collection for display
  const collections = new Map<string, typeof products>();
  for (const p of filtered) {
    const key = p.collection || 'Other';
    const list = collections.get(key) ?? [];
    list.push(p);
    collections.set(key, list);
  }

  function filterHref(col: string) {
    const params = new URLSearchParams();
    if (col !== 'all') params.set('collection', col);
    if (selectedSlug) params.set('setting', selectedSlug);
    if (diamondId) params.set('diamond', diamondId);
    const qs = params.toString();
    return `/ring-builder/setting${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="builder-page">
      <BuilderStepper
        current={2}
        hasSetting={!!selectedSlug}
        hasDiamond={!!diamondId}
        settingSlug={selectedSlug}
        diamondId={diamondId}
      />

      <section className="builder-section-head">
        <span className="section-eyebrow">Step 02 of 04</span>
        <h1 className="section-title">Select your setting</h1>
        <p className="section-body">
          Choose the setting that holds your stone. Every setting is handcrafted in Los
          Angeles. Click a setting to continue to your diamond.
        </p>
      </section>

      {/* Collection filter bar */}
      <nav className="builder-collection-filter" aria-label="Filter by collection">
        <Link
          href={filterHref('all')}
          className={`builder-filter-chip${activeCollection === 'all' ? ' active' : ''}`}
        >
          All ({products.length})
        </Link>
        {allCollections.map((col) => {
          const count = products.filter((p) => p.collection === col).length;
          return (
            <Link
              key={col}
              href={filterHref(col)}
              className={`builder-filter-chip${activeCollection.toLowerCase() === col.toLowerCase() ? ' active' : ''}`}
            >
              {col} ({count})
            </Link>
          );
        })}
      </nav>

      {/* Result count */}
      <p className="builder-result-count">
        {filtered.length} setting{filtered.length !== 1 ? 's' : ''}
        {activeCollection !== 'all' ? ` in ${activeCollection}` : ''}
      </p>

      <div className="builder-rings">
        {Array.from(collections.entries()).map(([col, list]) => (
          <section key={col} className="builder-collection-block">
            {activeCollection === 'all' && (
              <h2 className="builder-collection-name">{col}</h2>
            )}
            <div className="builder-rings-grid">
              {list.map((p) => {
                const heroImage = p.images?.[0] ?? null;
                const params = new URLSearchParams();
                params.set('setting', p.slug);
                if (diamondId) params.set('diamond', diamondId);
                const href = `/ring-builder/diamond?${params.toString()}`;

                // Build metal swatch dots from the product's metals
                const metals: string[] = Array.isArray(p.metals)
                  ? (p.metals as string[]).slice(0, 4)
                  : [];

                return (
                  <Link
                    key={p.sku}
                    href={href}
                    className={`builder-ring-card${selectedSlug === p.slug ? ' is-selected' : ''}`}
                    aria-label={`Choose ${p.name} and select a diamond`}
                  >
                    <div className="builder-ring-img">
                      {heroImage ? (
                        <Image
                          src={heroImage}
                          alt={p.name}
                          width={400}
                          height={400}
                          loading="lazy"
                        />
                      ) : (
                        <div className="builder-ring-fallback">
                          <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
                            <circle cx="28" cy="28" r="20" stroke="#AC3438" strokeWidth="1.5" />
                            <circle cx="28" cy="28" r="12" stroke="#AC3438" strokeWidth="0.75" opacity="0.5" />
                            <circle cx="28" cy="28" r="4" fill="#AC3438" opacity="0.3" />
                          </svg>
                        </div>
                      )}
                      {selectedSlug === p.slug && (
                        <span className="builder-ring-selected">✓ Selected</span>
                      )}
                    </div>
                    <div className="builder-ring-body">
                      <span className="builder-ring-sku">Style {p.sku}</span>
                      <h3 className="builder-ring-name">{p.name}</h3>
                      {/* Metal swatches */}
                      {metals.length > 0 && (
                        <div className="builder-ring-metals">
                          {metals.map((m) => {
                            const slug = typeof m === 'string' ? m.toLowerCase().replace(/\s+/g, '-') : '';
                            const color = METAL_COLORS[slug] ?? METAL_COLORS[slug.split('-').pop() ?? ''] ?? '#C4B8A0';
                            return (
                              <span
                                key={m}
                                className="builder-ring-metal-dot"
                                style={{ background: color }}
                                title={typeof m === 'string' ? m : ''}
                              />
                            );
                          })}
                        </div>
                      )}
                      {p.price_display && (
                        <span className="builder-ring-price">{p.price_display}</span>
                      )}
                      <span className="builder-ring-choose">Select &amp; choose diamond &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="builder-empty">
          <p>No settings found for &ldquo;{activeCollection}&rdquo;.</p>
          <Link href="/ring-builder/setting" className="builder-empty-reset">View all settings</Link>
        </div>
      )}

      {/* AI advisor link */}
      <div className="builder-advisor-strip">
        <span className="builder-advisor-text">
          Not sure which setting is right?
        </span>
        <button
          data-dnh="I'm in the ring builder choosing a setting. Can you help me pick the right one for my style?"
          className="builder-advisor-btn"
        >
          Ask the AI Advisor
        </button>
      </div>
    </main>
  );
}
