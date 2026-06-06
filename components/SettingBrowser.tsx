'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products';

// ─── Metal helpers ────────────────────────────────────────────────────────────

interface MetalOption {
  key: string;      // normalised lookup key
  display: string;  // "14K White Gold"
  karat: string;    // "14K"
  name: string;     // "White Gold"
  color: string;    // swatch CSS colour
}

function normaliseMetalKey(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function parseMetalOption(raw: string): MetalOption {
  const up = raw.toUpperCase();
  // Karat
  const karatMatch = up.match(/(\d+)\s*K/);
  const karat = karatMatch ? `${karatMatch[1]}K` : '';
  // Colour family
  const isRose = /ROSE/i.test(raw) || /PINK/i.test(raw);
  const isYellow = /YELLOW/i.test(raw) || (!isRose && /GOLD/i.test(raw) && !/WHITE/i.test(raw));
  const isWhite = /WHITE/i.test(raw);
  const isPlatinum = /PLAT/i.test(raw);

  let name = 'Gold';
  let color = '#D4A843';
  if (isRose) { name = 'Rose Gold'; color = '#C98080'; }
  else if (isWhite) { name = 'White Gold'; color = '#C8C8C8'; }
  else if (isYellow) { name = 'Yellow Gold'; color = '#D4A843'; }
  else if (isPlatinum) { name = 'Platinum'; color = '#E8E8F0'; }

  return {
    key: normaliseMetalKey(raw),
    display: karat ? `${karat} ${name}` : name,
    karat,
    name,
    color,
  };
}

function productMatchesMetal(product: Product, metalKey: string): boolean {
  return (product.metals ?? []).some((m) => normaliseMetalKey(m) === metalKey);
}

// ─── Price helpers ────────────────────────────────────────────────────────────

function parsePrice(display: string | null): number | null {
  if (!display) return null;
  const m = display.replace(/,/g, '').match(/[\d.]+/);
  return m ? Math.round(Number(m[0])) : null;
}

// ─── Shape data ──────────────────────────────────────────────────────────────

const SHAPES = [
  { value: 'round',    label: 'Round',    icon: <RoundSVG /> },
  { value: 'oval',     label: 'Oval',     icon: <OvalSVG /> },
  { value: 'cushion',  label: 'Cushion',  icon: <CushionSVG /> },
  { value: 'princess', label: 'Princess', icon: <PrincessSVG /> },
  { value: 'pear',     label: 'Pear',     icon: <PearSVG /> },
  { value: 'emerald',  label: 'Emerald',  icon: <EmeraldSVG /> },
  { value: 'marquise', label: 'Marquise', icon: <MarquiseSVG /> },
  { value: 'radiant',  label: 'Radiant',  icon: <RadiantSVG /> },
  { value: 'heart',    label: 'Heart',    icon: <HeartSVG /> },
  { value: 'asscher',  label: 'Asscher',  icon: <AsscherSVG /> },
];

// ─── Shape SVGs ──────────────────────────────────────────────────────────────

function RoundSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="20" r="14"/><line x1="20" y1="6" x2="14" y2="20"/><line x1="14" y1="20" x2="20" y2="34"/><line x1="20" y1="6" x2="26" y2="20"/><line x1="26" y1="20" x2="20" y2="34"/><line x1="6" y1="20" x2="14" y2="20"/><line x1="26" y1="20" x2="34" y2="20"/></svg>;
}
function OvalSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="20" cy="20" rx="11" ry="15"/><line x1="20" y1="5" x2="14" y2="20"/><line x1="14" y1="20" x2="20" y2="35"/><line x1="20" y1="5" x2="26" y2="20"/><line x1="26" y1="20" x2="20" y2="35"/></svg>;
}
function CushionSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="24" height="24" rx="5"/><line x1="8" y1="8" x2="20" y2="20"/><line x1="32" y1="8" x2="20" y2="20"/><line x1="8" y1="32" x2="20" y2="20"/><line x1="32" y1="32" x2="20" y2="20"/></svg>;
}
function PrincessSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="24" height="24"/><line x1="8" y1="8" x2="20" y2="20"/><line x1="32" y1="8" x2="20" y2="20"/><line x1="8" y1="32" x2="20" y2="20"/><line x1="32" y1="32" x2="20" y2="20"/></svg>;
}
function PearSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 34 C10 34, 8 26, 8 22 C8 14, 14 8, 20 8 C26 8, 32 14, 32 22 C32 26, 30 34, 20 34Z"/><line x1="20" y1="8" x2="14" y2="25"/><line x1="20" y1="8" x2="26" y2="25"/></svg>;
}
function EmeraldSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,6 28,6 34,14 34,26 28,34 12,34 6,26 6,14"/><line x1="12" y1="6" x2="6" y2="14"/><line x1="28" y1="6" x2="34" y2="14"/><line x1="12" y1="34" x2="6" y2="26"/><line x1="28" y1="34" x2="34" y2="26"/></svg>;
}
function MarquiseSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 5 C28 11, 35 15, 35 20 C35 25, 28 29, 20 35 C12 29, 5 25, 5 20 C5 15, 12 11, 20 5Z"/><line x1="5" y1="20" x2="35" y2="20"/><line x1="20" y1="5" x2="20" y2="35"/></svg>;
}
function RadiantSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="10,6 30,6 34,10 34,30 30,34 10,34 6,30 6,10"/><line x1="10" y1="6" x2="20" y2="20"/><line x1="30" y1="6" x2="20" y2="20"/><line x1="10" y1="34" x2="20" y2="20"/><line x1="30" y1="34" x2="20" y2="20"/></svg>;
}
function HeartSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 34 L6 20 C4 18, 4 10, 10 8 C14 7, 18 10, 20 14 C22 10, 26 7, 30 8 C36 10, 36 18, 34 20 Z"/></svg>;
}
function AsscherSVG() {
  return <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,6 28,6 34,12 34,28 28,34 12,34 6,28 6,12"/><polygon points="14,10 26,10 30,14 30,26 26,30 14,30 10,26 10,14"/></svg>;
}

// ─── Ring style icon (generic) ────────────────────────────────────────────────

function StyleRingIcon() {
  return (
    <svg viewBox="0 0 56 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <ellipse cx="28" cy="14" rx="20" ry="10" />
      <ellipse cx="28" cy="14" rx="13" ry="6" />
      <circle cx="28" cy="4" r="3" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingBrowser({ products }: Props) {
  // Derive unique, sorted collections
  const allCollections = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of products) {
      if (p.collection && !seen.has(p.collection)) {
        seen.add(p.collection);
        out.push(p.collection);
      }
    }
    return out.sort();
  }, [products]);

  // Derive unique metal options
  const allMetals = useMemo(() => {
    const seen = new Map<string, MetalOption>();
    for (const p of products) {
      for (const m of (p.metals ?? [])) {
        const opt = parseMetalOption(m);
        if (!seen.has(opt.key)) seen.set(opt.key, opt);
      }
    }
    // Sort: Rose, Yellow, White, Platinum; then by karat desc
    return Array.from(seen.values()).sort((a, b) => {
      const order = ['Rose Gold', 'Yellow Gold', 'White Gold', 'Gold', 'Platinum'];
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      if (ia !== ib) return ia - ib;
      return Number(b.karat) - Number(a.karat);
    });
  }, [products]);

  // Derive price bounds
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const p of products) {
      const price = parsePrice(p.price_display);
      if (price !== null) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    }
    return { globalMin: Math.floor((min === Infinity ? 100 : min) / 100) * 100, globalMax: Math.ceil((max || 10000) / 1000) * 1000 };
  }, [products]);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showMoreStyles, setShowMoreStyles] = useState(false);
  const [showMoreMetals, setShowMoreMetals] = useState(false);
  const [showMoreShapes, setShowMoreShapes] = useState(false);

  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [activeMetals, setActiveMetals] = useState<Set<string>>(new Set());
  const [activeShapes, setActiveShapes] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState(globalMin);
  const [priceMax, setPriceMax] = useState(globalMax);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const activeCount = activeStyles.size + activeMetals.size + activeShapes.size +
    (priceMin !== globalMin || priceMax !== globalMax ? 1 : 0);

  function toggleSet<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  }

  const resetAll = useCallback(() => {
    setActiveStyles(new Set());
    setActiveMetals(new Set());
    setActiveShapes(new Set());
    setPriceMin(globalMin);
    setPriceMax(globalMax);
    setSort('featured');
  }, [globalMin, globalMax]);

  // ── Filtered + sorted products ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = products;

    if (activeStyles.size > 0) {
      result = result.filter((p) => p.collection && activeStyles.has(p.collection));
    }
    if (activeMetals.size > 0) {
      result = result.filter((p) =>
        (p.metals ?? []).some((m) => activeMetals.has(normaliseMetalKey(m)))
      );
    }
    // Shape filter: passed as URL param when selecting setting; no product-level shape data
    // so we don't filter products by shape here — it's a diamond pre-selection

    result = result.filter((p) => {
      const price = parsePrice(p.price_display);
      if (price === null) return true;
      return price >= priceMin && price <= priceMax;
    });

    if (sort === 'price-asc') {
      result = [...result].sort((a, b) => (parsePrice(a.price_display) ?? 0) - (parsePrice(b.price_display) ?? 0));
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => (parsePrice(b.price_display) ?? 0) - (parsePrice(a.price_display) ?? 0));
    }

    return result;
  }, [products, activeStyles, activeMetals, priceMin, priceMax, sort]);

  const visibleStyles = showMoreStyles ? allCollections : allCollections.slice(0, 5);
  const visibleMetals = showMoreMetals ? allMetals : allMetals.slice(0, 5);
  const visibleShapes = showMoreShapes ? SHAPES : SHAPES.slice(0, 5);

  // Chosen shape (for passing to diamond step via setting detail URL)
  const chosenShape = activeShapes.size === 1 ? Array.from(activeShapes)[0] : null;

  return (
    <div className="sb">
      {/* ── Filter toggle bar ─────────────────────────────────────────── */}
      <div className="sb-toggle-bar">
        <button
          className="sb-toggle-btn"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <span className="sb-toggle-chevron">{filtersOpen ? '∧' : '∨'}</span>
          {filtersOpen ? 'Hide' : 'Show'} all filters
          <span className="sb-toggle-count">({activeCount})</span>
        </button>
        {activeCount > 0 && (
          <button className="sb-reset-btn" onClick={resetAll}>
            Clear all
          </button>
        )}
      </div>

      {/* ── Filter panel ──────────────────────────────────────────────── */}
      {filtersOpen && (
        <div className="sb-filters">
          {/* Left column: Style + Metal */}
          <div className="sb-filters-col">
            {/* Style */}
            <div className="sb-filter-section">
              <div className="sb-filter-title">Style</div>
              <div className="sb-style-chips">
                {visibleStyles.map((col) => (
                  <button
                    key={col}
                    className={`sb-style-chip${activeStyles.has(col) ? ' is-active' : ''}`}
                    onClick={() => setActiveStyles((s) => toggleSet(s, col))}
                    aria-pressed={activeStyles.has(col)}
                  >
                    <span className="sb-style-icon"><StyleRingIcon /></span>
                    <span className="sb-style-label">{col}</span>
                  </button>
                ))}
              </div>
              {allCollections.length > 5 && (
                <button className="sb-more-btn" onClick={() => setShowMoreStyles((v) => !v)}>
                  {showMoreStyles ? '∧ Less' : '∨ More Styles'}
                </button>
              )}
            </div>

            {/* Metal */}
            <div className="sb-filter-section">
              <div className="sb-filter-title">Metal</div>
              <div className="sb-metal-chips">
                {visibleMetals.map((m) => (
                  <button
                    key={m.key}
                    className={`sb-metal-chip${activeMetals.has(m.key) ? ' is-active' : ''}`}
                    onClick={() => setActiveMetals((s) => toggleSet(s, m.key))}
                    aria-pressed={activeMetals.has(m.key)}
                    title={m.display}
                  >
                    <span className="sb-metal-circle" style={{ background: m.color }}>
                      {m.karat && <span className="sb-metal-karat">{m.karat}</span>}
                    </span>
                    <span className="sb-metal-name">{m.name}</span>
                  </button>
                ))}
              </div>
              {allMetals.length > 5 && (
                <button className="sb-more-btn" onClick={() => setShowMoreMetals((v) => !v)}>
                  {showMoreMetals ? '∧ Less' : '∨ More Metals'}
                </button>
              )}
            </div>
          </div>

          {/* Right column: Price + Shape */}
          <div className="sb-filters-col">
            {/* Price */}
            <div className="sb-filter-section">
              <div className="sb-filter-title">Price</div>
              <div className="sb-price-wrap">
                <div className="sb-price-slider-track">
                  <input
                    type="range"
                    className="sb-range sb-range--min"
                    min={globalMin}
                    max={globalMax}
                    step={100}
                    value={priceMin}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v < priceMax) setPriceMin(v);
                    }}
                  />
                  <input
                    type="range"
                    className="sb-range sb-range--max"
                    min={globalMin}
                    max={globalMax}
                    step={100}
                    value={priceMax}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > priceMin) setPriceMax(v);
                    }}
                  />
                </div>
                <div className="sb-price-inputs">
                  <input
                    type="number"
                    className="sb-price-input"
                    value={priceMin}
                    min={globalMin}
                    max={priceMax - 100}
                    step={100}
                    onChange={(e) => setPriceMin(Math.max(globalMin, Number(e.target.value)))}
                    aria-label="Minimum price"
                  />
                  <span className="sb-price-dash">—</span>
                  <input
                    type="number"
                    className="sb-price-input"
                    value={priceMax}
                    min={priceMin + 100}
                    max={globalMax}
                    step={100}
                    onChange={(e) => setPriceMax(Math.min(globalMax, Number(e.target.value)))}
                    aria-label="Maximum price"
                  />
                </div>
              </div>
            </div>

            {/* Shape */}
            <div className="sb-filter-section">
              <div className="sb-filter-title">Shape</div>
              <div className="sb-shape-chips">
                {visibleShapes.map((s) => (
                  <button
                    key={s.value}
                    className={`sb-shape-chip${activeShapes.has(s.value) ? ' is-active' : ''}`}
                    onClick={() => setActiveShapes((st) => toggleSet(st, s.value))}
                    aria-pressed={activeShapes.has(s.value)}
                  >
                    <span className="sb-shape-icon">{s.icon}</span>
                    <span className="sb-shape-label">{s.label}</span>
                  </button>
                ))}
              </div>
              {SHAPES.length > 5 && (
                <button className="sb-more-btn" onClick={() => setShowMoreShapes((v) => !v)}>
                  {showMoreShapes ? '∧ Less' : '∨ More Shapes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar: count + sort ──────────────────────────────────────── */}
      <div className="sb-toolbar">
        <span className="sb-toolbar-count">
          {filtered.length} setting{filtered.length !== 1 ? 's' : ''}
          {activeCount > 0 ? ' matching filters' : ''}
        </span>
        <label className="sb-sort-label">
          Sort order:
          <select
            className="sb-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      {/* ── Product grid ──────────────────────────────────────────────── */}
      <div className="sb-grid">
        {filtered.length === 0 ? (
          <div className="sb-empty">
            <p>No settings match the current filters.</p>
            <button className="sb-reset-btn" onClick={resetAll}>Clear all filters</button>
          </div>
        ) : (
          filtered.map((p) => (
            <SettingCard key={p.slug} product={p} chosenShape={chosenShape} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function SettingCard({ product: p, chosenShape }: { product: Product; chosenShape: string | null }) {
  const href = `/ring-builder/setting/${p.slug}${chosenShape ? `?shape=${chosenShape}` : ''}`;

  const metalSwatches = useMemo(() => {
    const seen = new Set<string>();
    const out: MetalOption[] = [];
    for (const m of (p.metals ?? [])) {
      const opt = parseMetalOption(m);
      if (!seen.has(opt.color)) {
        seen.add(opt.color);
        out.push(opt);
      }
    }
    return out.slice(0, 4);
  }, [p.metals]);

  const heroImage = p.images?.[0] ?? null;

  return (
    <Link href={href} className="sb-card">
      <div className="sb-card-img">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            style={{ objectFit: 'contain' }}
            loading="lazy"
          />
        ) : (
          <svg className="sb-card-placeholder" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <circle cx="40" cy="40" r="28" stroke="#c9b8ad" strokeWidth="1" />
            <circle cx="40" cy="40" r="16" stroke="#c9b8ad" strokeWidth="0.6" />
            <circle cx="40" cy="12" r="4" fill="#c9b8ad" />
          </svg>
        )}
      </div>

      <div className="sb-card-body">
        <h3 className="sb-card-name">
          {p.name}
          {p.sku && <span className="sb-card-sku"> ({p.sku})</span>}
        </h3>

        {metalSwatches.length > 0 && (
          <div className="sb-card-swatches">
            {metalSwatches.map((m) => (
              <span
                key={m.color}
                className="sb-card-swatch"
                style={{ background: m.color }}
                title={m.display}
              />
            ))}
          </div>
        )}

        {p.price_display && (
          <p className="sb-card-price">{formatUSD(p.price_display)}</p>
        )}
      </div>
    </Link>
  );
}

function formatUSD(display: string): string {
  const price = parsePrice(display);
  if (price === null) return display;
  return `$${price.toLocaleString('en-US')} USD`;
}
