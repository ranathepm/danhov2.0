'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CollectionCardClient from '@/components/CollectionCardClient';
import { stripMetalSuffix } from '@/lib/product-display';

// ── Shared types (exported so CategoryCardsSection can use them) ──────────────

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

// ── SVGs ──────────────────────────────────────────────────────────────────────

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

// ── Category metadata ─────────────────────────────────────────────────────────

type CategoryKey = 'wedding' | 'fine' | 'mens';

const CATEGORY_META: Record<CategoryKey, {
  label: string;
  meaning: string;
  body: string;
  title: string;
  intro: string;
  viewAllHref: string;
  viewAllLabel: string;
  svg: React.ReactNode;
}> = {
  wedding: {
    label: 'Wedding Bands',
    meaning: 'The Unbroken Circle',
    body: 'Two people. One unbroken form. Handcrafted bands made with the same intention as the moment they mark.',
    title: 'The circle that begins where it ends.',
    intro: "Two people. One unbroken form. DANHOV's bands are made with the same intention as the moment they mark.",
    viewAllHref: '/wedding-bands',
    viewAllLabel: 'Browse All Wedding Bands',
    svg: WEDDING_SVG,
  },
  fine: {
    label: 'Fine Jewelry',
    meaning: 'The Daily Beautiful',
    body: 'Designed to be worn every day. Small enough to forget. Beautiful enough to remember forever.',
    title: 'Quiet pieces, for loud lives.',
    intro: 'Designed to be worn every day. Small enough to forget. Beautiful enough to remember forever.',
    viewAllHref: '/fine-jewelry',
    viewAllLabel: 'Browse All Fine Jewelry',
    svg: FINE_SVG,
  },
  mens: {
    label: "Men's Jewelry",
    meaning: 'The Worn Statement',
    body: 'A ring that carries a name. A band that asks nothing — and says everything.',
    title: 'Strength, worn well.',
    intro: 'A ring that carries a name. A band that asks nothing — and says everything.',
    viewAllHref: '/mens',
    viewAllLabel: "Browse All Men's Jewelry",
    svg: MENS_SVG,
  },
};

const CATEGORY_KEYS: CategoryKey[] = ['wedding', 'fine', 'mens'];

// ── Expandable card (button styled as cat-card) ───────────────────────────────

function ExpandableCard({
  categoryKey,
  isOpen,
  onToggle,
}: {
  categoryKey: CategoryKey;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[categoryKey];
  return (
    <button
      type="button"
      className={`cat-card cat-card--expandable${isOpen ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <div className="cat-photo">
        <div className="cat-photo-placeholder">{meta.svg}</div>
      </div>
      <div className="cat-info">
        <span className="cat-eyebrow">{meta.label}</span>
        <p className="cat-meaning">{meta.meaning}</p>
        <p className="cat-body">{meta.body}</p>
        <span className="cat-link cat-link--expand">
          {isOpen ? 'Close ↑' : `Explore ${meta.label} ↓`}
        </span>
      </div>
    </button>
  );
}

// ── Collection card inside the expanded panel ─────────────────────────────────

function PanelCollectionCard({ col }: { col: CollectionItem }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (col.images.length <= 1) return;
    setActiveIdx(1);
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % col.images.length);
    }, 1100);
  }

  function stopCycle() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setActiveIdx(0);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <Link
      href={`/collection/${col.slug}`}
      className="cat-card"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      <div className="cat-photo">
        {col.images.length > 0 ? (
          col.images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${col.name} by DANHOV`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              style={{
                objectFit: 'contain',
                padding: '12px',
                mixBlendMode: 'multiply',
                opacity: i === activeIdx ? 1 : 0,
                transition: 'opacity 0.45s ease',
                zIndex: i === activeIdx ? 1 : 0,
              }}
              unoptimized={src.includes('.supabase.co') || src.endsWith('.gif')}
              priority={i === 0}
            />
          ))
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
        {col.meaning && <p className="cat-meaning">{col.meaning}</p>}
        <p className="cat-body">{col.body}</p>
        <span className="cat-link">Explore {col.name} &rarr;</span>
      </div>
    </Link>
  );
}

// ── Product card inside the expanded panel (fallback when no collections) ─────

function PanelProductCard({ product }: { product: ProductItem }) {
  const img = (product.images ?? [])[0] ?? null;
  const name = stripMetalSuffix(product.name);
  return (
    <Link href={`/product/${product.slug}`} className="hp-prod-card">
      <div className="hp-prod-media">
        {img ? (
          <Image
            src={img}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            style={{ objectFit: 'contain', padding: '12px', mixBlendMode: 'multiply' }}
            unoptimized={img.includes('.supabase.co') || img.endsWith('.gif')}
          />
        ) : (
          <div className="hp-prod-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="16" stroke="#AC3438" strokeWidth="1.2" />
              <circle cx="24" cy="24" r="8" stroke="#AC3438" strokeWidth="0.7" opacity="0.5" />
            </svg>
          </div>
        )}
      </div>
      <div className="hp-prod-info">
        {product.collection && <span className="hp-prod-collection">{product.collection}</span>}
        <h3 className="hp-prod-name">{name}</h3>
        {product.price_display && <p className="hp-prod-price">{product.price_display}</p>}
      </div>
    </Link>
  );
}

// ── Expanded section panel ────────────────────────────────────────────────────

function CategoryPanel({
  categoryKey,
  data,
}: {
  categoryKey: CategoryKey;
  data: CategoryData;
}) {
  const meta = CATEGORY_META[categoryKey];
  return (
    <div className="cat-expand-panel">
      <div className="categories-header">
        <span className="section-eyebrow">{meta.label}</span>
        <h2 className="section-title">{meta.title}</h2>
        <p className="categories-intro">{meta.intro}</p>
      </div>

      {data.collections.length > 0 ? (
        <div className="categories-grid">
          {data.collections.map((col) => (
            <PanelCollectionCard key={col.slug} col={col} />
          ))}
        </div>
      ) : data.products.length > 0 ? (
        <div className="hp-shop-grid">
          {data.products.map((p) => (
            <PanelProductCard key={p.sku} product={p} />
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: '#9e8880', padding: '32px 0', fontFamily: "'Jost', sans-serif" }}>
          No pieces available yet.
        </p>
      )}

      <div className="col-section-cta">
        <Link href={meta.viewAllHref} className="btn-solid">{meta.viewAllLabel}</Link>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CategoryGridClient({
  engagementCards,
  weddingData,
  fineData,
  mensData,
}: {
  engagementCards: EngagementCard[];
  weddingData: CategoryData;
  fineData: CategoryData;
  mensData: CategoryData;
}) {
  const [openPanel, setOpenPanel] = useState<CategoryKey | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function togglePanel(key: CategoryKey) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }

  useEffect(() => {
    if (openPanel && panelRef.current) {
      const timeout = setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return () => clearTimeout(timeout);
    }
  }, [openPanel]);

  const dataMap: Record<CategoryKey, CategoryData> = {
    wedding: weddingData,
    fine: fineData,
    mens: mensData,
  };

  return (
    <>
      <div className="categories-grid">
        {/* 12 engagement collection cards + Life Path */}
        {engagementCards.map((col) => (
          <CollectionCardClient
            key={col.value}
            href={col.href}
            images={col.images}
            label={col.label}
            meaning={col.meaning}
            body={col.body}
            linkLabel={col.linkLabel}
            customSvg={col.isLifePath ? LIFE_PATH_SVG : undefined}
          />
        ))}

        {/* 3 expandable category cards */}
        {CATEGORY_KEYS.map((key) => (
          <ExpandableCard
            key={key}
            categoryKey={key}
            isOpen={openPanel === key}
            onToggle={() => togglePanel(key)}
          />
        ))}
      </div>

      {/* Expanded panel — appears below the grid, scrolls into view */}
      <div ref={panelRef}>
        {openPanel && (
          <CategoryPanel categoryKey={openPanel} data={dataMap[openPanel]} />
        )}
      </div>
    </>
  );
}
