'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/products';
import { DiamondCardMedia, type ShapeT } from '@/components/DiamondPicker';
import { useCart } from '@/components/CartProvider';
import { stripMetalSuffix } from '@/lib/product-display';

export type ReviewDiamond = {
  offer_id: string;
  carat: number;
  shape: string;
  color: string;
  clarity: string;
  cut: string;
  lab: string;
  cert_number: string | null;
  image: string | null;
  video: string | null;
  price_usd: number;
};

type Props = {
  mode: 'ring' | 'setting' | 'diamond';
  setting: Product | null;
  diamond: ReviewDiamond | null;
  settingPrice: number;
  holdId?: string;
  metal?: string | null;
};

const US_RING_SIZES = [
  '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
  '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13',
];

export default function BuilderReview({ mode, setting, diamond, settingPrice, holdId, metal }: Props) {
  const { addItem } = useCart();

  const [email, setEmail] = useState('');
  const [ringSize, setRingSize] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const needsRingSize = mode === 'ring' || mode === 'setting';
  const diamondPrice = diamond?.price_usd ?? 0;
  const total =
    mode === 'ring'
      ? settingPrice + diamondPrice
      : mode === 'setting'
      ? settingPrice
      : diamondPrice;
  const deposit = Math.round(total * 0.5);

  function validate(): boolean {
    setErr(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErr('Please enter a valid email address.');
      return false;
    }
    if (needsRingSize && !ringSize) {
      setErr('Please select a ring size before continuing.');
      return false;
    }
    return true;
  }

  async function startCommission() {
    if (!validate()) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        mode,
        email,
        ring_size: ringSize || undefined,
        note: customerNote.trim() || undefined,
      };
      if (mode === 'ring' || mode === 'setting') {
        body.setting_slug = setting?.slug;
        if (metal) body.metal = metal;
      }
      if (mode === 'ring' || mode === 'diamond') {
        body.diamond_offer_id = diamond?.offer_id;
        body.hold_id = holdId;
      }

      const r = await fetch('/api/ring-builder/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok || !data.url) {
        throw new Error(data.error || 'Could not open checkout.');
      }
      window.location.href = data.url as string;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Could not open checkout.');
      setLoading(false);
    }
  }

  function addToCart() {
    if (needsRingSize && !ringSize) {
      setErr('Please select a ring size before adding to cart.');
      return;
    }
    setErr(null);

    const note = customerNote.trim() || null;
    if (mode === 'ring' && setting && diamond) {
      addItem({
        id: `bundle-${setting.slug}-${diamond.offer_id}`,
        sku: setting.sku,
        slug: setting.slug,
        name: `${stripMetalSuffix(setting.name)} + ${diamond.carat.toFixed(2)}ct ${diamond.shape}`,
        collection: setting.collection ?? null,
        metal: setting.default_metal ?? null,
        image: setting.images?.[0] ?? null,
        price_display: `$${total.toLocaleString('en-US')}`,
        price_num: total,
        ring_size: ringSize || null,
        note,
        bundle: {
          setting_price_usd: settingPrice,
          diamond: {
            offer_id: diamond.offer_id,
            hold_id: holdId ?? null,
            shape: diamond.shape,
            carat: diamond.carat,
            color: diamond.color,
            clarity: diamond.clarity,
            cut: diamond.cut,
            lab: diamond.lab,
            cert_number: diamond.cert_number,
            price_usd: diamond.price_usd,
            image: diamond.image,
          },
        },
      });
    } else if (mode === 'setting' && setting) {
      addItem({
        id: `setting-${setting.slug}-${ringSize}`,
        sku: setting.sku,
        slug: setting.slug,
        name: stripMetalSuffix(setting.name),
        collection: setting.collection ?? null,
        metal: setting.default_metal ?? null,
        image: setting.images?.[0] ?? null,
        price_display: `$${settingPrice.toLocaleString('en-US')}`,
        price_num: settingPrice,
        ring_size: ringSize || null,
        note,
        bundle: null,
      });
    } else if (mode === 'diamond' && diamond) {
      addItem({
        id: `diamond-${diamond.offer_id}`,
        sku: diamond.offer_id.slice(0, 20),
        slug: 'loose-diamond',
        name: `${diamond.carat.toFixed(2)} ct ${diamond.shape} Diamond`,
        collection: `${diamond.lab}${diamond.cert_number ? ` · ${diamond.cert_number}` : ''}`,
        metal: null,
        image: diamond.image,
        price_display: `$${diamondPrice.toLocaleString('en-US')}`,
        price_num: diamondPrice,
        ring_size: null,
        note,
        bundle: null,
      });
    }

    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2500);
  }

  const heroImage = setting?.images?.[0] ?? null;
  const certLabel = diamond
    ? diamond.cert_number
      ? `${diamond.lab} · ${diamond.cert_number}`
      : diamond.lab
    : null;

  return (
    <div className="builder-review">
      <div className="builder-review-top">
        {/* ── Visuals ─────────────────────────────────────────────────── */}
        <div className="builder-review-visual">
          {mode !== 'diamond' && (
            <div className="builder-review-img">
              {heroImage ? (
                <Image src={heroImage} alt={setting?.name ?? 'Setting'} width={520} height={520} />
              ) : (
                <div className="builder-ring-fallback">
                  <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
                    <circle cx="28" cy="28" r="20" stroke="#AC3438" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
          )}
          {diamond && (diamond.image || diamond.video) && (
            <div className={`builder-review-diamond-img${mode === 'diamond' ? ' builder-review-diamond-img--hero' : ''}`}>
              <div className="builder-review-diamond-media">
                <DiamondCardMedia
                  image={diamond.image}
                  video={diamond.video}
                  shape={diamond.shape.toUpperCase() as ShapeT}
                  carat={diamond.carat}
                  autoPlay={true}
                />
              </div>
              <span className="builder-review-diamond-caption">
                Your stone{diamond.video ? ' · 360° view' : ''}
              </span>
            </div>
          )}
          <p className="builder-review-tagline">
            {mode === 'ring'
              ? 'Your one-of-one — handcrafted in Los Angeles, made in 4–6 weeks.'
              : mode === 'setting'
              ? 'Handcrafted to order in Los Angeles · 4–6 week lead time.'
              : 'GIA-graded · conflict-free · ethically traced.'}
          </p>
        </div>

        {/* ── Details & form ──────────────────────────────────────────── */}
        <div className="builder-review-details">
          {/* Setting line */}
          {mode !== 'diamond' && setting && (
            <div className="builder-review-line">
              <div>
                <h3>{stripMetalSuffix(setting.name)}</h3>
                <span className="builder-review-sku">Style {setting.sku}</span>
                {setting.collection && (
                  <span className="builder-review-collection"> · {setting.collection}</span>
                )}
                {mode === 'setting' && (
                  <div className="builder-review-grade">Setting only · diamond not included</div>
                )}
              </div>
              <span className="builder-review-price">
                ${settingPrice.toLocaleString('en-US')}
              </span>
            </div>
          )}

          {mode === 'ring' && <div className="builder-review-divider" />}

          {/* Diamond line */}
          {mode !== 'setting' && diamond && (
            <div className="builder-review-line">
              <div>
                <h3>
                  {diamond.carat.toFixed(2)} ct {diamond.shape} Diamond
                </h3>
                <span className="builder-review-sku">{certLabel}</span>
                <div className="builder-review-grade">
                  {diamond.color} colour · {diamond.clarity} clarity · {diamond.cut} cut
                  {holdId && <> · reserved for you for 24h</>}
                </div>
              </div>
              <span className="builder-review-price">
                ${diamondPrice.toLocaleString('en-US')}
              </span>
            </div>
          )}

          <div className="builder-review-divider builder-review-divider-strong" />

          {/* Totals */}
          <div className="builder-review-totals">
            <div className="builder-review-total-row">
              <span>
                {mode === 'ring' ? 'Commission total' : mode === 'setting' ? 'Setting total' : 'Diamond total'}
              </span>
              <strong>${total.toLocaleString('en-US')}</strong>
            </div>
            <p className="builder-review-balance">
              {mode !== 'diamond' && 'Production: 4–6 weeks. '}Lifetime craftsmanship warranty.
            </p>
          </div>

          {/* Ring size — required for ring/setting, hidden for diamond-only */}
          {needsRingSize && (
            <div className="builder-review-ring-size">
              <label className="builder-review-ring-size-label" htmlFor="rb-ring-size">
                Ring Size <span className="builder-review-ring-size-us">(US sizing)</span>
                <span className="builder-review-ring-size-req">Required</span>
              </label>
              <select
                id="rb-ring-size"
                className="builder-review-ring-size-select"
                value={ringSize}
                onChange={(e) => { setRingSize(e.target.value); setErr(null); }}
              >
                <option value="">— Select your size —</option>
                {US_RING_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="other">Other / International — I&apos;ll note in email</option>
              </select>
              <p className="builder-review-ring-size-hint">
                Not sure of your size? A specialist will confirm before production begins.
              </p>
            </div>
          )}

          {/* Optional customer message */}
          <div className="builder-review-note">
            <label className="builder-review-note-label" htmlFor="rb-note">
              Message for our team
              <span>(Optional)</span>
            </label>
            <textarea
              id="rb-note"
              className="builder-review-note-textarea"
              placeholder="Special requests, engraving ideas, questions for our jewelers…"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Add a setting — shown in diamond-only mode */}
          {mode === 'diamond' && diamond && (
            <div className="builder-review-add-setting">
              <div className="builder-review-add-setting-text">
                <strong>Want to pair this diamond with a setting?</strong>
                Browse our handcrafted settings — your diamond will be carried through.
              </div>
              <a
                href={`/ring-builder/setting?diamond=${encodeURIComponent(diamond.offer_id)}${holdId ? `&hold=${encodeURIComponent(holdId)}` : ''}`}
                className="builder-review-add-setting-btn"
              >
                Add a Setting →
              </a>
            </div>
          )}

          {/* Email + action buttons */}
          <div className="builder-review-form">
            <input
              type="email"
              placeholder="your@email.com"
              className="quote-lock-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="builder-review-actions">
              <button
                type="button"
                className="builder-cta-next builder-commission-btn"
                onClick={startCommission}
                disabled={loading}
              >
                {loading ? 'Opening secure checkout…' : 'Begin Commission →'}
              </button>
              <button
                type="button"
                className="builder-addtocart-btn"
                onClick={addToCart}
              >
                {cartAdded ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
            </div>
          </div>

          {err && <p className="quote-lock-err" style={{ marginTop: 8 }}>{err}</p>}

          <p className="builder-review-secured">
            Secured by Stripe · Your card is charged only when you confirm. We will email
            you the order reference and a specialist will reach out within one business
            day to confirm {needsRingSize ? 'size, engraving, and stone' : 'shipping and order'} details.
          </p>
        </div>
      </div>
    </div>
  );
}
