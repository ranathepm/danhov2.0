'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  hold_id?: string | null;
};

type Props = {
  mode: 'ring' | 'setting' | 'diamond';
  setting: Product | null;
  diamonds: ReviewDiamond[];
  settingPrice: number;
  metal?: string | null;
};

const US_RING_SIZES = [
  '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5',
  '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13',
];

export default function BuilderReview({ mode, setting, diamonds, settingPrice, metal }: Props) {
  const { addItem } = useCart();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [ringSize, setRingSize] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [settingQty, setSettingQty] = useState(1);
  const [diamondQtys, setDiamondQtys] = useState<number[]>(() => diamonds.map(() => 1));
  const [loading, setLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [addingAnother, setAddingAnother] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const needsRingSize = mode === 'ring' || mode === 'setting';

  const settingSubtotal = settingPrice * settingQty;
  const diamondSubtotals = diamonds.map((d, i) => d.price_usd * (diamondQtys[i] ?? 1));
  const total =
    (mode !== 'diamond' ? settingSubtotal : 0) +
    (mode !== 'setting' ? diamondSubtotals.reduce((a, b) => a + b, 0) : 0);
  const deposit = Math.round(total * 0.5);

  function setDiamondQty(i: number, v: number) {
    setDiamondQtys(prev => prev.map((q, j) => (j === i ? v : q)));
  }

  function removeDiamond(offerId: string) {
    const remaining = diamonds.filter(d => d.offer_id !== offerId);
    const qs = new URLSearchParams();
    if (remaining.length === 0) {
      if (setting?.slug) qs.set('setting', setting.slug);
      if (metal) qs.set('metal', metal);
      router.push(`/ring-builder/diamond?${qs.toString()}`);
      return;
    }
    qs.set('diamonds', remaining.map(d => d.offer_id).join('|'));
    if (setting?.slug) qs.set('setting', setting.slug);
    if (metal) qs.set('metal', metal);
    if (remaining.length === 1 && remaining[0].hold_id) qs.set('hold', remaining[0].hold_id);
    router.push(`/ring-builder/review?${qs.toString()}`);
  }

  function addAnotherDiamond() {
    setAddingAnother(true);
    const existingIds = diamonds.map(d => d.offer_id).join('|');
    const qs = new URLSearchParams();
    if (setting?.slug) qs.set('setting', setting.slug);
    if (metal) qs.set('metal', metal);
    qs.set('orderdiamond', existingIds);
    router.push(`/ring-builder/diamond?${qs.toString()}`);
  }

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
        body.setting_quantity = settingQty;
        if (metal) body.metal = metal;
      }
      if (mode !== 'setting' && diamonds.length > 0) {
        body.diamonds = diamonds.map((d, i) => ({
          offer_id: d.offer_id,
          quantity: diamondQtys[i] ?? 1,
          hold_id: d.hold_id ?? null,
        }));
        // Legacy compat for single diamond
        body.diamond_offer_id = diamonds[0].offer_id;
        body.hold_id = diamonds[0].hold_id ?? undefined;
        body.quantity = diamondQtys[0] ?? 1;
      }

      const r = await fetch('/api/ring-builder/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || 'Could not open checkout.');
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

    if (mode === 'ring' && setting) {
      for (const [i, diamond] of diamonds.entries()) {
        const qty = diamondQtys[i] ?? 1;
        for (let q = 0; q < qty; q++) {
          addItem({
            id: `bundle-${setting.slug}-${diamond.offer_id}${qty > 1 ? `-${q}` : ''}`,
            sku: setting.sku,
            slug: setting.slug,
            name: `${stripMetalSuffix(setting.name)} + ${diamond.carat.toFixed(2)}ct ${diamond.shape}`,
            collection: setting.collection ?? null,
            metal: setting.default_metal ?? null,
            image: setting.images?.[0] ?? null,
            price_display: `$${(settingPrice + diamond.price_usd).toLocaleString('en-US')}`,
            price_num: settingPrice + diamond.price_usd,
            ring_size: ringSize || null,
            note,
            bundle: {
              setting_price_usd: settingPrice,
              diamond: {
                offer_id: diamond.offer_id,
                hold_id: diamond.hold_id ?? null,
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
        }
      }
    } else if (mode === 'setting' && setting) {
      for (let i = 0; i < settingQty; i++) {
        addItem({
          id: `setting-${setting.slug}-${ringSize}${settingQty > 1 ? `-${i}` : ''}`,
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
      }
    } else if (mode === 'diamond') {
      for (const [i, diamond] of diamonds.entries()) {
        const qty = diamondQtys[i] ?? 1;
        for (let q = 0; q < qty; q++) {
          addItem({
            id: `diamond-${diamond.offer_id}${qty > 1 ? `-${q}` : ''}`,
            sku: diamond.offer_id.slice(0, 20),
            slug: 'loose-diamond',
            name: `${diamond.carat.toFixed(2)} ct ${diamond.shape} Diamond`,
            collection: `${diamond.lab}${diamond.cert_number ? ` · ${diamond.cert_number}` : ''}`,
            metal: null,
            image: diamond.image,
            price_display: `$${diamond.price_usd.toLocaleString('en-US')}`,
            price_num: diamond.price_usd,
            ring_size: null,
            note,
            bundle: null,
          });
        }
      }
    }

    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2500);
  }

  const heroImage = setting?.images?.[0] ?? null;
  const firstDiamond = diamonds[0] ?? null;

  return (
    <div className="builder-review">
      <div className="builder-review-top">
        {/* ── Visuals ───────────────────────────────────────────────────── */}
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
          {firstDiamond && (firstDiamond.image || firstDiamond.video) && (
            <div className={`builder-review-diamond-img${mode === 'diamond' ? ' builder-review-diamond-img--hero' : ''}`}>
              <div className="builder-review-diamond-media">
                <DiamondCardMedia
                  image={firstDiamond.image}
                  video={firstDiamond.video}
                  shape={firstDiamond.shape.toUpperCase() as ShapeT}
                  carat={firstDiamond.carat}
                  autoPlay={true}
                />
              </div>
              <span className="builder-review-diamond-caption">
                Your stone{firstDiamond.video ? ' · 360° view' : ''}
                {diamonds.length > 1 ? ` (1 of ${diamonds.length})` : ''}
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

        {/* ── Details & form ────────────────────────────────────────────── */}
        <div className="builder-review-details">

          {/* Setting line */}
          {mode !== 'diamond' && setting && (
            <div className="builder-review-line">
              <div className="builder-review-line-left">
                <h3>{stripMetalSuffix(setting.name)}</h3>
                <span className="builder-review-sku">Style {setting.sku}</span>
                {setting.collection && (
                  <span className="builder-review-collection"> · {setting.collection}</span>
                )}
                {mode === 'setting' && (
                  <div className="builder-review-grade">Setting only · diamond not included</div>
                )}
              </div>
              <div className="builder-review-line-right">
                <span className="builder-review-price">
                  ${settingPrice.toLocaleString('en-US')}
                </span>
                <div className="builder-review-item-qty">
                  <button
                    type="button"
                    className="builder-review-qty-btn"
                    disabled={settingQty <= 1}
                    onClick={() => setSettingQty(q => Math.max(1, q - 1))}
                    aria-label="Decrease setting quantity"
                  >−</button>
                  <span className="builder-review-qty-val">{settingQty}</span>
                  <button
                    type="button"
                    className="builder-review-qty-btn"
                    disabled={settingQty >= 10}
                    onClick={() => setSettingQty(q => Math.min(10, q + 1))}
                    aria-label="Increase setting quantity"
                  >+</button>
                </div>
                {settingQty > 1 && (
                  <span className="builder-review-line-subtotal">
                    ${settingSubtotal.toLocaleString('en-US')}
                  </span>
                )}
              </div>
            </div>
          )}

          {mode === 'ring' && <div className="builder-review-divider" />}

          {/* Diamond lines — one per selected diamond */}
          {mode !== 'setting' && diamonds.map((diamond, i) => {
            const qty = diamondQtys[i] ?? 1;
            const subtotal = diamond.price_usd * qty;
            const certLabel = diamond.cert_number
              ? `${diamond.lab} · ${diamond.cert_number}`
              : diamond.lab;

            return (
              <div key={diamond.offer_id}>
                {i > 0 && <div className="builder-review-divider" />}
                <div className="builder-review-line">
                  <div className="builder-review-line-left">
                    {diamonds.length > 1 && (
                      <span className="builder-review-diamond-idx">Diamond {i + 1} of {diamonds.length}</span>
                    )}
                    <h3>
                      {diamond.carat.toFixed(2)} ct {diamond.shape} Diamond
                    </h3>
                    <span className="builder-review-sku">{certLabel}</span>
                    <div className="builder-review-grade">
                      {diamond.color} colour · {diamond.clarity} clarity · {diamond.cut} cut
                      {diamond.hold_id && <> · reserved for you for 24h</>}
                    </div>
                  </div>
                  <div className="builder-review-line-right">
                    <span className="builder-review-price">
                      ${diamond.price_usd.toLocaleString('en-US')}
                    </span>
                    <div className="builder-review-item-qty">
                      <button
                        type="button"
                        className="builder-review-qty-btn"
                        disabled={qty <= 1}
                        onClick={() => setDiamondQty(i, Math.max(1, qty - 1))}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="builder-review-qty-val">{qty}</span>
                      <button
                        type="button"
                        className="builder-review-qty-btn"
                        disabled={qty >= 10}
                        onClick={() => setDiamondQty(i, Math.min(10, qty + 1))}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                    {qty > 1 && (
                      <span className="builder-review-line-subtotal">
                        Subtotal ${subtotal.toLocaleString('en-US')}
                      </span>
                    )}
                    {diamonds.length > 1 && (
                      <button
                        type="button"
                        className="builder-review-remove-diamond"
                        onClick={() => removeDiamond(diamond.offer_id)}
                        aria-label={`Remove diamond ${i + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="builder-review-divider builder-review-divider-strong" />

          {/* Totals */}
          <div className="builder-review-totals">
            {/* Sub-line breakdown when there are multiple items or qty > 1 */}
            {(settingQty > 1 || diamonds.length > 1 || diamondQtys.some(q => q > 1)) && (
              <>
                {mode !== 'diamond' && setting && (
                  <div className="builder-review-total-row builder-review-total-row--sub">
                    <span>Setting{settingQty > 1 ? ` × ${settingQty}` : ''}</span>
                    <span>${settingSubtotal.toLocaleString('en-US')}</span>
                  </div>
                )}
                {mode !== 'setting' && diamonds.map((d, i) => (
                  <div key={d.offer_id} className="builder-review-total-row builder-review-total-row--sub">
                    <span>
                      {diamonds.length > 1 ? `Diamond ${i + 1}` : 'Diamond'}
                      {(diamondQtys[i] ?? 1) > 1 && ` × ${diamondQtys[i]}`}
                    </span>
                    <span>${diamondSubtotals[i].toLocaleString('en-US')}</span>
                  </div>
                ))}
              </>
            )}
            <div className="builder-review-total-row">
              <span>
                {mode === 'ring' ? 'Commission total' : mode === 'setting' ? 'Setting total' : 'Diamond total'}
              </span>
              <strong>${total.toLocaleString('en-US')}</strong>
            </div>
            <div className="builder-review-total-row builder-review-deposit">
              <span>50% deposit due today</span>
              <strong>${deposit.toLocaleString('en-US')}</strong>
            </div>
            <p className="builder-review-balance">
              {mode !== 'diamond' && 'Production: 4–6 weeks. '}Lifetime craftsmanship warranty.
            </p>
          </div>

          {/* Ring size */}
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

          {/* Diamond-only extras */}
          {mode === 'diamond' && firstDiamond && (
            <>
              <div className="builder-review-add-setting">
                <div className="builder-review-add-setting-text">
                  <strong>Want to pair this diamond with a setting?</strong>
                  Browse our handcrafted settings — your diamond will be carried through.
                </div>
                <a
                  href={`/ring-builder/setting?diamond=${encodeURIComponent(firstDiamond.offer_id)}${firstDiamond.hold_id ? `&hold=${encodeURIComponent(firstDiamond.hold_id)}` : ''}`}
                  className="builder-review-add-setting-btn"
                >
                  Add a Setting →
                </a>
              </div>
              <div className="builder-review-add-diamond">
                <div className="builder-review-add-diamond-text">
                  <strong>Add another diamond?</strong>
                  Select a second stone — it appears as a separate line item in this order.
                </div>
                <button
                  type="button"
                  className="builder-review-add-diamond-btn"
                  disabled={addingAnother}
                  onClick={addAnotherDiamond}
                >
                  {addingAnother ? 'Loading picker…' : 'Browse Diamonds →'}
                </button>
              </div>
            </>
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
                {loading ? 'Opening secure checkout…' : 'Checkout →'}
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
