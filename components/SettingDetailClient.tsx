'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { stripMetalSuffix } from '@/lib/product-display';

export interface ShapeOption { value: string; label: string; }

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
  metal: string;
  onMetalChange: (m: string) => void;
  diamondId?: string;
  diamondsParam?: string | null;
}

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
  metal,
  onMetalChange,
  diamondId,
  diamondsParam,
}: Props) {
  const router = useRouter();
  const productMetals = product.metals ?? [];
  const [showMoreMetals, setShowMoreMetals] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const visibleMetals = showMoreMetals ? productMetals : productMetals.slice(0, 5);

  function handleSelect() {
    if (diamondsParam || diamondId) {
      // One or more diamonds already chosen — go straight to review with all
      const params = new URLSearchParams({ setting: product.slug });
      if (metal) params.set('metal', metal);
      if (diamondsParam) {
        params.set('diamonds', diamondsParam);
      } else if (diamondId) {
        params.set('diamond', diamondId);
      }
      router.push(`/ring-builder/review?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ setting: product.slug });
      if (metal) params.set('metal', metal);
      router.push(`/ring-builder/diamond?${params.toString()}`);
    }
  }

  function handleBuySettingOnly() {
    router.push(`/ring-builder/review?setting=${encodeURIComponent(product.slug)}`);
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
            {stripMetalSuffix(product.name)}
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
                onClick={() => onMetalChange(m)}
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
        {diamondId ? 'Complete This Ring →' : 'Select Setting → Add Diamond'}
      </button>
      <button className="sd-cta-secondary sd-cta-setting-only" onClick={handleBuySettingOnly}>
        Buy Setting Only (No Diamond)
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

