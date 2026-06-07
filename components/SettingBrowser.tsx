'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products';
import { stripMetalSuffix } from '@/lib/product-display';

// ─── Metal helpers ─────────────────────────────────────────────────────────

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

  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [activeMetals, setActiveMetals] = useState<Set<string>>(new Set());
  // Both thumbs start at globalMin → fill = 0 (empty). Sentinel: filter only when max > globalMin.
  const [priceMin, setPriceMin] = useState(globalMin);
  const [priceMax, setPriceMax] = useState(globalMin);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const priceFiltered = priceMax > globalMin;
  const activeCount = activeStyles.size + activeMetals.size + (priceFiltered ? 1 : 0);

  function toggleSet<T>(set: Set<T>, val: T): Set<T> {
    const next = new Set(set);
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  }

  const resetAll = useCallback(() => {
    setActiveStyles(new Set());
    setActiveMetals(new Set());
    setPriceMin(globalMin);
    setPriceMax(globalMin);
    setSort('featured');
  }, [globalMin]);

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
    if (priceFiltered) {
      result = result.filter((p) => {
        const price = parsePrice(p.price_display);
        if (price === null) return true;
        return price >= priceMin && price <= priceMax;
      });
    }

    if (sort === 'price-asc') {
      result = [...result].sort((a, b) => (parsePrice(a.price_display) ?? 0) - (parsePrice(b.price_display) ?? 0));
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => (parsePrice(b.price_display) ?? 0) - (parsePrice(a.price_display) ?? 0));
    }

    return result;
  }, [products, activeStyles, activeMetals, priceFiltered, priceMin, priceMax, sort]);

  const visibleStyles = showMoreStyles ? allCollections : allCollections.slice(0, 5);
  const visibleMetals = showMoreMetals ? allMetals : allMetals.slice(0, 5);

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

          {/* Right column: Price */}
          <div className="sb-filters-col">
            <div className="sb-filter-section">
              <div className="sb-filter-title">Price</div>
              <div className="sb-price-wrap">
                <div className="sb-price-slider-track">
                  <div className="sb-price-track-bg" />
                  <div
                    className="sb-price-track-fill"
                    style={{
                      left: `${((priceMin - globalMin) / Math.max(globalMax - globalMin, 1)) * 100}%`,
                      right: `${100 - ((priceMax - globalMin) / Math.max(globalMax - globalMin, 1)) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    className="sb-range sb-range--min"
                    min={globalMin}
                    max={globalMax}
                    step={100}
                    value={priceMin}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v <= priceMax) setPriceMin(v);
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
                      if (v >= priceMin) setPriceMax(v);
                    }}
                  />
                </div>
                <div className="sb-price-inputs">
                  <input
                    type="number"
                    className="sb-price-input"
                    value={priceMin}
                    min={globalMin}
                    max={globalMax}
                    step={100}
                    onChange={(e) => {
                      const v = Math.max(globalMin, Math.min(globalMax, Number(e.target.value)));
                      setPriceMin(v);
                      if (v > priceMax) setPriceMax(v);
                    }}
                    aria-label="Minimum price"
                  />
                  <span className="sb-price-dash">—</span>
                  <input
                    type="number"
                    className="sb-price-input"
                    value={priceMax}
                    min={globalMin}
                    max={globalMax}
                    step={100}
                    onChange={(e) => {
                      const v = Math.max(globalMin, Math.min(globalMax, Number(e.target.value)));
                      setPriceMax(v);
                      if (v < priceMin) setPriceMin(v);
                    }}
                    aria-label="Maximum price"
                  />
                </div>
              </div>
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
            <SettingCard key={p.slug} product={p} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function SettingCard({ product: p }: { product: Product }) {
  const href = `/ring-builder/setting/${p.slug}`;
  const cardRef = useRef<HTMLAnchorElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    el.style.transform = `perspective(700px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-3px)`;
  }

  function onMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.45s cubic-bezier(0.23,1,0.32,1), box-shadow 0.18s, border-color 0.18s';
    el.style.transform = '';
    setTimeout(() => { if (el) el.style.transition = ''; }, 450);
  }

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
    <Link
      ref={cardRef}
      href={href}
      className="sb-card"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
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
          {stripMetalSuffix(p.name)}
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
