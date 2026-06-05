'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ShapeOption { value: string; label: string; }

interface ProductInfo {
  slug: string;
  sku: string;
  name: string;
  collection: string | null;
  metals: string[];
  price_display: string | null;
}

interface Props {
  product: ProductInfo;
  defaultShape: string;
  defaultMetal: string | null;
  shapes: ShapeOption[];
}

const SHAPE_ICONS: Record<string, React.ReactNode> = {
  round:    <RoundSVG />,
  oval:     <OvalSVG />,
  cushion:  <CushionSVG />,
  princess: <PrincessSVG />,
  pear:     <PearSVG />,
  emerald:  <EmeraldSVG />,
  marquise: <MarquiseSVG />,
  radiant:  <RadiantSVG />,
  heart:    <HeartSVG />,
  asscher:  <AsscherSVG />,
};

function metalColour(raw: string): string {
  const up = raw.toUpperCase();
  if (/ROSE|PINK/.test(up)) return '#C98080';
  if (/WHITE/.test(up)) return '#C8C8C8';
  if (/PLAT/.test(up)) return '#E8E8F0';
  return '#D4A843';
}

function metalKarat(raw: string): string {
  const m = raw.match(/(\d+)\s*[kK]/);
  return m ? `${m[1]}K` : '';
}

export default function SettingDetailClient({
  product,
  defaultShape,
  defaultMetal,
  shapes,
}: Props) {
  const router = useRouter();
  const productMetals = product.metals ?? [];
  const [shape, setShape] = useState(defaultShape);
  const [metal, setMetal] = useState(defaultMetal ?? productMetals[0] ?? '');
  const [showMoreShapes, setShowMoreShapes] = useState(false);
  const [showMoreMetals, setShowMoreMetals] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const visibleShapes = showMoreShapes ? shapes : shapes.slice(0, 5);
  const visibleMetals = showMoreMetals ? productMetals : productMetals.slice(0, 5);

  function handleSelect() {
    const params = new URLSearchParams({ setting: product.slug });
    if (shape) params.set('shape', shape);
    if (metal) params.set('metal', metal);
    router.push(`/ring-builder/diamond?${params.toString()}`);
  }

  function handleSave() {
    setSaved(true);
    // Could integrate with wishlist here
    setTimeout(() => setSaved(false), 2000);
  }

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
    }
  }

  const price = product.price_display;
  const priceFormatted = price
    ? '$' + (price.replace(/[^0-9]/g, '') || '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' USD'
    : null;

  // Metal display name
  const metalDisplay = metal
    ? [metalKarat(metal), metalLabel(metal)].filter(Boolean).join(' ')
    : '';

  return (
    <div className="sd-panel">
      {/* Name + share */}
      <div className="sd-name-row">
        <div>
          <h1 className="sd-name">
            {product.name}
            {product.sku && <span className="sd-sku"> ({product.sku})</span>}
          </h1>
          {product.collection && (
            <div className="sd-style-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
              <span className="sd-style-label">Style</span>
              <span className="sd-style-value">{product.collection}</span>
            </div>
          )}
        </div>
        <button className="sd-share-btn" onClick={handleShare} aria-label="Share this setting">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>
      </div>

      {/* Shape selector */}
      <div className="sd-selector">
        <div className="sd-selector-head">
          <span className="sd-selector-title">Shape</span>
          <span className="sd-selector-current">{shapes.find((s) => s.value === shape)?.label ?? 'Round'}</span>
        </div>
        <div className="sd-option-chips">
          {visibleShapes.map((s) => (
            <button
              key={s.value}
              className={`sd-option-chip${shape === s.value ? ' is-active' : ''}`}
              onClick={() => setShape(s.value)}
              aria-pressed={shape === s.value}
            >
              <span className="sd-option-icon">{SHAPE_ICONS[s.value]}</span>
              <span className="sd-option-label">{s.label}</span>
            </button>
          ))}
        </div>
        {shapes.length > 5 && (
          <button className="sd-more-btn" onClick={() => setShowMoreShapes((v) => !v)}>
            {showMoreShapes ? '∧ Fewer Shapes' : '∨ More Shapes'}
          </button>
        )}
      </div>

      {/* Metal selector */}
      {productMetals.length > 0 && (
        <div className="sd-selector">
          <div className="sd-selector-head">
            <span className="sd-selector-title">Metal</span>
            <span className="sd-selector-current">{metalDisplay}</span>
          </div>
          <div className="sd-metal-options">
            {visibleMetals.map((m) => (
              <button
                key={m}
                className={`sd-metal-option${metal === m ? ' is-active' : ''}`}
                onClick={() => setMetal(m)}
                aria-pressed={metal === m}
                title={m}
              >
                <span
                  className="sd-metal-circle"
                  style={{ background: metalColour(m) }}
                >
                  {metalKarat(m) && <span className="sd-metal-karat">{metalKarat(m)}</span>}
                </span>
                <span className="sd-metal-name">{metalLabel(m)}</span>
              </button>
            ))}
          </div>
          {productMetals.length > 5 && (
            <button className="sd-more-btn" onClick={() => setShowMoreMetals((v) => !v)}>
              {showMoreMetals ? '∧ Fewer Metals' : '∨ More Metals'}
            </button>
          )}
        </div>
      )}

      {/* Price */}
      <div className="sd-price-row">
        <span className="sd-price-label">Price</span>
        <div className="sd-price-right">
          {priceFormatted ? (
            <strong className="sd-price">{priceFormatted}</strong>
          ) : (
            <span className="sd-price-na">Contact us for pricing</span>
          )}
          <span className="sd-price-sub">Price only for Setting</span>
        </div>
      </div>

      {/* CTAs */}
      <button className="sd-cta-primary" onClick={handleSelect}>
        Select Setting
      </button>
      <button className="sd-cta-secondary" onClick={handleSave}>
        {saved ? 'Saved ✓' : 'Save for later'}
      </button>

      {/* Description accordion */}
      <div className="sd-accordion">
        <button
          className="sd-accordion-head"
          onClick={() => setDescOpen((v) => !v)}
          aria-expanded={descOpen}
        >
          <span>Description</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            style={{ transform: descOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {descOpen && (
          <div className="sd-accordion-body">
            <p className="sd-desc-text">
              This {product.collection ?? ''} setting is handcrafted to order in Los Angeles using
              the finest materials. Each piece reflects DANHOV&apos;s commitment to sacred
              geometry and enduring craftsmanship.
            </p>
            <table className="sd-specs-table">
              <tbody>
                {productMetals.length > 0 && (
                  <tr>
                    <td>Available metals</td>
                    <td>{productMetals.join(', ')}</td>
                  </tr>
                )}
                <tr>
                  <td>Collection</td>
                  <td>{product.collection ?? '—'}</td>
                </tr>
                <tr>
                  <td>SKU</td>
                  <td>{product.sku}</td>
                </tr>
                <tr>
                  <td>Made in</td>
                  <td>Los Angeles, California</td>
                </tr>
              </tbody>
            </table>
            <p className="sd-desc-note">
              Note: Setting price does not include the center diamond. Compatible with the
              shape selected above. Lead time is typically 4–6 weeks after your commission is
              confirmed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function metalLabel(raw: string): string {
  const up = raw.toUpperCase();
  if (/ROSE|PINK/.test(up)) return 'Rose Gold';
  if (/WHITE/.test(up)) return 'White Gold';
  if (/YELLOW/.test(up)) return 'Yellow Gold';
  if (/PLAT/.test(up)) return 'Platinum';
  if (/GOLD/.test(up)) return 'Gold';
  return raw;
}

// ─── Shape SVGs (duplicated here so this file is self-contained) ────────────

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
