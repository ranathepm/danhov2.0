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

const WEDDING_SVG = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <circle cx="40" cy="60" r="22" stroke="#AC3438" strokeWidth="1.3" fill="none" />
    <circle cx="80" cy="60" r="22" stroke="#AC3438" strokeWidth="1.3" fill="none" />
    <circle cx="40" cy="60" r="13" stroke="#AC3438" strokeWidth="0.6" fill="rgba(172,52,56,0.06)" />
    <circle cx="80" cy="60" r="13" stroke="#AC3438" strokeWidth="0.6" fill="rgba(172,52,56,0.06)" />
    <line x1="40" y1="38" x2="40" y2="82" stroke="#AC3438" strokeWidth="0.4" opacity="0.3" />
    <line x1="80" y1="38" x2="80" y2="82" stroke="#AC3438" strokeWidth="0.4" opacity="0.3" />
  </svg>
);

const FINE_SVG = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <polygon points="60,18 92,56 60,94 28,56" stroke="#AC3438" strokeWidth="1.3" fill="rgba(172,52,56,0.05)" />
    <polygon points="60,34 78,56 60,78 42,56" stroke="#AC3438" strokeWidth="0.7" fill="rgba(172,52,56,0.04)" />
    <line x1="60" y1="18" x2="28" y2="56" stroke="#AC3438" strokeWidth="0.5" opacity="0.35" />
    <line x1="60" y1="18" x2="92" y2="56" stroke="#AC3438" strokeWidth="0.5" opacity="0.35" />
    <line x1="28" y1="56" x2="42" y2="56" stroke="#AC3438" strokeWidth="0.5" opacity="0.35" />
    <line x1="78" y1="56" x2="92" y2="56" stroke="#AC3438" strokeWidth="0.5" opacity="0.35" />
    <circle cx="60" cy="56" r="3.5" fill="#AC3438" opacity="0.45" />
  </svg>
);

const MENS_SVG = (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
    <circle cx="60" cy="60" r="34" stroke="#AC3438" strokeWidth="1.3" fill="none" />
    <circle cx="60" cy="60" r="24" stroke="#AC3438" strokeWidth="5" fill="rgba(172,52,56,0.05)" />
    <circle cx="60" cy="60" r="15" stroke="#AC3438" strokeWidth="0.5" fill="none" opacity="0.35" />
  </svg>
);

const FALLBACK_SVGS: Record<string, React.ReactNode> = {
  wedding: WEDDING_SVG,
  fine: FINE_SVG,
  mens: MENS_SVG,
};

// ── Grid renderer ─────────────────────────────────────────────────────────

export default function CategoryGridClient({
  engagementCards,
}: {
  engagementCards: EngagementCard[];
}) {
  return (
    <div className="categories-grid">
      {engagementCards.map((col) => {
        const fallbackSvg = col.isLifePath
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
          />
        );
      })}
    </div>
  );
}
