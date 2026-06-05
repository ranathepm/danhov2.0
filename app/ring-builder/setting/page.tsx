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

type Search = { setting?: string; diamond?: string };

export default async function SelectRingPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const products = await fetchProductsByCategory('engagement');
  const selectedSlug = searchParams.setting;
  const diamondId = searchParams.diamond;

  // Group by collection for easier scanning
  const collections = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.collection || 'Other';
    const list = collections.get(key) ?? [];
    list.push(p);
    collections.set(key, list);
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
        <h1 className="section-title">Select your <em>setting</em></h1>
        <p className="section-body">
          Choose the setting that holds your stone. Every setting is handcrafted in Los
          Angeles. Click a setting to continue to your diamond.
        </p>
      </section>

      <div className="builder-rings">
        {Array.from(collections.entries()).map(([col, list]) => (
          <section key={col} className="builder-collection-block">
            <h2 className="builder-collection-name">{col}</h2>
            <div className="builder-rings-grid">
              {list.map((p) => {
                const heroImage = p.images?.[0] ?? null;
                // Click a setting → go straight to the diamond step (no
                // intermediate "select" state). Carries the chosen setting
                // (and any already-picked diamond) forward.
                const params = new URLSearchParams();
                params.set('setting', p.slug);
                if (diamondId) params.set('diamond', diamondId);
                const href = `/ring-builder/diamond?${params.toString()}`;
                return (
                  <Link
                    key={p.sku}
                    href={href}
                    className="builder-ring-card"
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
                    </div>
                    <div className="builder-ring-body">
                      <span className="builder-ring-sku">Style {p.sku}</span>
                      <h3 className="builder-ring-name">{p.name}</h3>
                      {p.price_display && (
                        <span className="builder-ring-price">{p.price_display}</span>
                      )}
                      <span className="builder-ring-choose">Select &amp; choose diamond →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
