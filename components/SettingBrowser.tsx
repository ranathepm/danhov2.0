'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products';
import { stripMetalSuffix } from '@/lib/product-display';

// ─── Metal helpers ─────────────────────────────────────────────────────────

interface MetalOption {
  key: string;
  display: string;
  karat: string;
  name: string;
  color: string;
}

function normaliseMetalKey(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function parseMetalOption(raw: string): MetalOption {
  const up = raw.toUpperCase();
  const karatMatch = up.match(/(\d+)\s*K/);
  const karat = karatMatch ? `${karatMatch[1]}K` : '';
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

// ─── Grouping helpers ──────────────────────────────────────────────────────

// Strip trailing metal/karat code from SKU: -14r, -14w, -14y, -18r, -pl, -plat, etc.
function baseSkuKey(sku: string | null | undefined): string {
  if (!sku) return `__no_sku__${Math.random()}`;
  return sku.replace(/-\d*[a-z]+$/i, '').toLowerCase();
}

function displayBaseSku(sku: string): string {
  return sku.replace(/-\d*[a-z]+$/i, '');
}

// Determine the primary metal for this product variant (for swatch colour)
function variantPrimaryMetal(p: Product): string | null {
  if (p.default_metal) return p.default_metal;
  const sku = p.sku ?? '';
  const m = sku.match(/-(\d{2})?([a-z]+)$/i);
  if (m) {
    const karat = m[1] ?? '14';
    const code = m[2].toLowerCase();
    const codeMap: Record<string, string> = {
      r: `${karat}k_rose_gold`, rg: `${karat}k_rose_gold`,
      y: `${karat}k_yellow_gold`, yg: `${karat}k_yellow_gold`,
      w: `${karat}k_white_gold`, wg: `${karat}k_white_gold`,
      pl: 'platinum', plat: 'platinum',
    };
    if (codeMap[code]) return codeMap[code];
  }
  return p.metals?.[0] ?? null;
}

type ProductGroup = {
  key: string;
  canonical: Product;
  variants: Product[];
  swatches: Array<{ metal: MetalOption; slug: string; metalRaw: string }>;
  minPrice: number | null;
};

function buildGroups(products: Product[]): ProductGroup[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = baseSkuKey(p.sku);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }

  return Array.from(map.values()).map((variants) => {
    const seenColors = new Set<string>();
    const swatches: Array<{ metal: MetalOption; slug: string; metalRaw: string }> = [];
    for (const v of variants) {
      const primaryMetal = variantPrimaryMetal(v);
      if (!primaryMetal) continue;
      const opt = parseMetalOption(primaryMetal);
      if (!seenColors.has(opt.color)) {
        seenColors.add(opt.color);
        swatches.push({ metal: opt, slug: v.slug, metalRaw: primaryMetal });
      }
    }
    // Fallback: derive swatches from first variant's metals array
    if (swatches.length === 0 && variants[0]) {
      for (const m of (variants[0].metals ?? []).slice(0, 4)) {
        const opt = parseMetalOption(m);
        if (!seenColors.has(opt.color)) {
          seenColors.add(opt.color);
          swatches.push({ metal: opt, slug: variants[0].slug, metalRaw: m });
        }
      }
    }

    let minPrice: number | null = null;
    for (const v of variants) {
      const p = parsePrice(v.price_display);
      if (p !== null && (minPrice === null || p < minPrice)) minPrice = p;
    }

    return {
      key: baseSkuKey(variants[0].sku),
      canonical: variants[0],
      variants,
      swatches: swatches.slice(0, 4),
      minPrice,
    };
  });
}

// ─── Price helpers ─────────────────────────────────────────────────────────

function parsePrice(display: string | null): number | null {
  if (!display) return null;
  const m = display.replace(/,/g, '').match(/[\d.]+/);
  return m ? Math.round(Number(m[0])) : null;
}

// ─── Ring style icon (generic) ─────────────────────────────────────────────

function StyleRingIcon() {
  return (
    <svg viewBox="0 0 56 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <ellipse cx="28" cy="14" rx="20" ry="10" />
      <ellipse cx="28" cy="14" rx="13" ry="6" />
      <circle cx="28" cy="4" r="3" />
    </svg>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface Props {
  products: Product[];
  diamondId?: string;
  diamondsParam?: string | null;
}

// ─── Main component ────────────────────────────────────────────────────────

export default function SettingBrowser({ products, diamondId, diamondsParam }: Props) {
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

  const allMetals = useMemo(() => {
    const seen = new Map<string, MetalOption>();
    for (const p of products) {
      for (const m of (p.metals ?? [])) {
        const opt = parseMetalOption(m);
        if (!seen.has(opt.key)) seen.set(opt.key, opt);
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      const order = ['Rose Gold', 'Yellow Gold', 'White Gold', 'Gold', 'Platinum'];
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      if (ia !== ib) return ia - ib;
      return Number(b.karat) - Number(a.karat);
    });
  }, [products]);

  // Group products by base SKU — one card per unique setting
  const groups = useMemo(() => buildGroups(products), [products]);

  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity;
    let max = 0;
    for (const g of groups) {
      if (g.minPrice !== null) {
        if (g.minPrice < min) min = g.minPrice;
        if (g.minPrice > max) max = g.minPrice;
      }
    }
    return {
      globalMin: Math.floor((min === Infinity ? 100 : min) / 100) * 100,
      globalMax: Math.ceil((max || 10000) / 1000) * 1000,
    };
  }, [groups]);

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showMoreStyles, setShowMoreStyles] = useState(false);
  const [showMoreMetals, setShowMoreMetals] = useState(false);

  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [activeMetals, setActiveMetals] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState(globalMin);
  const [priceMax, setPriceMax] = useState(globalMin);
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const [inputMin, setInputMin] = useState(String(globalMin));
  const [inputMax, setInputMax] = useState(String(globalMin));
  useEffect(() => { setInputMin(String(priceMin)); }, [priceMin]);
  useEffect(() => { setInputMax(String(priceMax)); }, [priceMax]);

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

  const filteredGroups = useMemo(() => {
    let result = groups;

    if (activeStyles.size > 0) {
      result = result.filter((g) => g.canonical.collection && activeStyles.has(g.canonical.collection));
    }
    if (activeMetals.size > 0) {
      result = result.filter((g) =>
        g.variants.some((v) =>
          (v.metals ?? []).some((m) => activeMetals.has(normaliseMetalKey(m)))
        )
      );
    }
    if (priceFiltered) {
      result = result.filter((g) => {
        if (g.minPrice === null) return true;
        return g.minPrice >= priceMin && g.minPrice <= priceMax;
      });
    }

    if (sort === 'price-asc') {
      result = [...result].sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));
    } else if (sort === 'price-desc') {
      result = [...result].sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
    }

    return result;
  }, [groups, activeStyles, activeMetals, priceFiltered, priceMin, priceMax, sort]);

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
                  <div className="sb-price-input-wrap">
                    <span className="sb-price-dollar">$</span>
                    <input
                      type="number"
                      className="sb-price-input"
                      value={inputMin}
                      min={globalMin}
                      max={globalMax}
                      step={100}
                      onChange={(e) => setInputMin(e.target.value)}
                      onBlur={() => {
                        const v = Math.max(globalMin, Math.min(globalMax, Number(inputMin) || globalMin));
                        const clamped = Math.min(v, priceMax > globalMin ? priceMax : globalMax);
                        setPriceMin(clamped);
                        setInputMin(String(clamped));
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      aria-label="Minimum price"
                    />
                  </div>
                  <span className="sb-price-dash">—</span>
                  <div className="sb-price-input-wrap">
                    <span className="sb-price-dollar">$</span>
                    <input
                      type="number"
                      className="sb-price-input"
                      value={inputMax}
                      min={globalMin}
                      max={globalMax}
                      step={100}
                      onChange={(e) => setInputMax(e.target.value)}
                      onBlur={() => {
                        const v = Math.max(globalMin, Math.min(globalMax, Number(inputMax) || globalMin));
                        const clamped = Math.max(v, priceMin);
                        setPriceMax(clamped);
                        setInputMax(String(clamped));
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      aria-label="Maximum price"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar: count + sort ──────────────────────────────────────── */}
      <div className="sb-toolbar">
        <span className="sb-toolbar-count">
          {filteredGroups.length} setting{filteredGroups.length !== 1 ? 's' : ''}
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
        {filteredGroups.length === 0 ? (
          <div className="sb-empty">
            <p>No settings match the current filters.</p>
            <button className="sb-reset-btn" onClick={resetAll}>Clear all filters</button>
          </div>
        ) : (
          filteredGroups.map((g) => (
            <SettingGroupCard key={g.key} group={g} diamondId={diamondId} diamondsParam={diamondsParam} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Group card ────────────────────────────────────────────────────────────

function SettingGroupCard({ group, diamondId, diamondsParam }: { group: ProductGroup; diamondId?: string; diamondsParam?: string | null }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const p = group.canonical;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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

  const heroImage = p.images?.[0] ?? null;
  const dSuffix = diamondsParam
    ? `?diamonds=${encodeURIComponent(diamondsParam)}`
    : diamondId
    ? `?diamond=${encodeURIComponent(diamondId)}`
    : '';
  const canonicalHref = `/ring-builder/setting/${p.slug}${dSuffix}`;
  const baseSku = p.sku ? displayBaseSku(p.sku) : null;

  return (
    <div
      ref={cardRef}
      className="sb-card"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <Link href={canonicalHref} className="sb-card-img-link" tabIndex={-1} aria-hidden="true">
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
      </Link>

      <div className="sb-card-body">
        <Link href={canonicalHref} className="sb-card-name-link">
          <h3 className="sb-card-name">
            {stripMetalSuffix(p.name)}
            {baseSku && <span className="sb-card-sku"> ({baseSku})</span>}
          </h3>
        </Link>

        {group.swatches.length > 0 && (
          <div className="sb-card-swatches">
            {group.swatches.map((s) => (
              <Link
                key={s.slug}
                href={`/ring-builder/setting/${s.slug}${dSuffix}`}
                className="sb-card-swatch"
                style={{ background: s.metal.color }}
                title={s.metal.display}
                aria-label={`View in ${s.metal.display}`}
              />
            ))}
          </div>
        )}

        {group.minPrice !== null && (
          <p className="sb-card-price">
            {group.swatches.length > 1 ? 'From ' : ''}${group.minPrice.toLocaleString('en-US')} USD
          </p>
        )}
      </div>
    </div>
  );
}
