import CollectionCardClient from '@/components/CollectionCardClient';

// ── Shared types (exported for use in CategoryCardsSection) ───────────────

export type CollectionItem = {
  name: string;
  slug: string;
  images: string[];
  meaning: string;
  body: string;
};

export type ProductItem = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  images: string[] | null;
  price_display: string | null;
};

export type CategoryData = {
  collections: CollectionItem[];
  products: ProductItem[];
};

export type EngagementCard = {
  label: string;
  value: string;
  meaning: string;
  body: string;
  href: string;
  images: string[];
  linkLabel: string;
  isLifePath: boolean;
};

// ── SVGs ──────────────────────────────────────────────────────────────────

const LIFE_PATH_SVG = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="40" stroke="#AC3438" strokeWidth="2" opacity="0.5" fill="none" />
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

const WEDDING_SVG = (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <circle cx="36" cy="50" r="20" stroke="#AC3438" strokeWidth="2" fill="none" />
    <circle cx="64" cy="50" r="20" stroke="#AC3438" strokeWidth="2" fill="none" />
    <circle cx="36" cy="50" r="11" stroke="#AC3438" strokeWidth="1" fill="rgba(172,52,56,0.07)" />
    <circle cx="64" cy="50" r="11" stroke="#AC3438" strokeWidth="1" fill="rgba(172,52,56,0.07)" />
  </svg>
);

const FINE_SVG = (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="42" r="18" stroke="#AC3438" strokeWidth="2" fill="rgba(172,52,56,0.06)" />
    <circle cx="50" cy="42" r="8" stroke="#AC3438" strokeWidth="1" fill="rgba(172,52,56,0.1)" />
    <line x1="50" y1="24" x2="50" y2="14" stroke="#AC3438" strokeWidth="2" strokeLinecap="round" />
    <path d="M42 14 Q50 10 58 14" stroke="#AC3438" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <line x1="50" y1="60" x2="50" y2="78" stroke="#AC3438" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" opacity="0.5" />
  </svg>
);

const MENS_SVG = (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="30" stroke="#AC3438" strokeWidth="2" fill="none" />
    <circle cx="50" cy="50" r="19" stroke="#AC3438" strokeWidth="6" fill="rgba(172,52,56,0.06)" />
    <circle cx="50" cy="50" r="10" stroke="#AC3438" strokeWidth="1" fill="none" opacity="0.4" />
  </svg>
);

const FALLBACK_SVGS: Record<string, React.ReactNode> = {
  wedding: WEDDING_SVG,
  fine: FINE_SVG,
  mens: MENS_SVG,
};

const FEATURED_VALUES = new Set(['wedding', 'fine', 'mens']);

// ── Grid renderer ─────────────────────────────────────────────────────────

export default function CategoryGridClient({
  engagementCards,
}: {
  engagementCards: EngagementCard[];
}) {
  const featured    = engagementCards.filter((c) => FEATURED_VALUES.has(c.value));
  const collections = engagementCards.filter((c) => !FEATURED_VALUES.has(c.value));

  return (
    <>
      {/* ── Featured: Wedding full-width, Fine + Mens side-by-side ── */}
      {featured.length > 0 && (
        <div className="cat-featured-strip">
          {featured.map((col) => (
            <CollectionCardClient
              key={col.value}
              href={col.href}
              images={col.images}
              label={col.label}
              meaning={col.meaning}
              body={col.body}
              linkLabel={col.linkLabel}
              customSvg={col.images.length === 0 ? (FALLBACK_SVGS[col.value] ?? undefined) : undefined}
              featured
            />
          ))}
        </div>
      )}

      {/* ── Typographic divider ── */}
      {collections.length > 0 && (
        <div className="cat-divider">
          <div className="cat-divider-rule" />
          <span className="cat-divider-label">Engagement Rings</span>
          <div className="cat-divider-rule" />
        </div>
      )}

      {/* ── Engagement collections: responsive editorial grid ── */}
      {collections.length > 0 && (
        <div className="cat-collections-grid">
          {collections.map((col) => {
            const fallbackSvg = col.isLifePath && col.images.length === 0
              ? LIFE_PATH_SVG
              : col.images.length === 0
              ? (FALLBACK_SVGS[col.value] ?? undefined)
              : undefined;

            return (
              <CollectionCardClient
                key={col.value}
                href={col.href}
                images={col.images}
                label={col.label}
                meaning={col.meaning}
                body={col.body}
                linkLabel={col.linkLabel}
                customSvg={fallbackSvg}
                editorial
              />
            );
          })}
        </div>
      )}

      {/* ── View all CTA ── */}
      <div className="cat-view-all">
        <a href="/engagement-rings" className="cat-view-all-btn">
          View All 580+ Rings
        </a>
      </div>
    </>
  );
}
