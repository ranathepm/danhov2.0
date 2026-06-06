'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/products';
import { DiamondCardMedia, type ShapeT } from '@/components/DiamondPicker';

export type ReviewDiamond = {
  offer_id: string;
  carat: number;
  shape: string;        // e.g. 'Round' (display-cased)
  color: string;
  clarity: string;
  cut: string;
  lab: string;          // e.g. 'GIA'
  cert_number: string | null;
  image: string | null;
  video: string | null;
  price_usd: number;
};

type Props = {
  setting: Product;
  diamond: ReviewDiamond;
  settingPrice: number;
  holdId?: string;
};

export default function BuilderReview({ setting, diamond, settingPrice, holdId }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const total = settingPrice + diamond.price_usd;
  const deposit = Math.round(total * 0.5);

  async function startCommission() {
    setErr(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErr('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/ring-builder/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_slug: setting.slug,
          diamond_offer_id: diamond.offer_id,
          hold_id: holdId,
          email,
        }),
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

  const heroImage = setting.images?.[0] ?? null;
  const certLabel = diamond.cert_number
    ? `${diamond.lab} · ${diamond.cert_number}`
    : diamond.lab;

  return (
    <div className="builder-review">
      <div className="builder-review-top">
        <div className="builder-review-visual">
          <div className="builder-review-img">
            {heroImage ? (
              <Image src={heroImage} alt={setting.name} width={520} height={520} />
            ) : (
              <div className="builder-ring-fallback">
                <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
                  <circle cx="28" cy="28" r="20" stroke="#AC3438" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
          {(diamond.image || diamond.video) && (
            <div className="builder-review-diamond-img">
              <div className="builder-review-diamond-media">
                <DiamondCardMedia
                  image={diamond.image}
                  video={diamond.video}
                  shape={diamond.shape.toUpperCase() as ShapeT}
                  carat={diamond.carat}
                />
              </div>
              <span className="builder-review-diamond-caption">
                Your stone{diamond.video ? ' · hover to spin 360°' : ''}
              </span>
            </div>
          )}
          <p className="builder-review-tagline">
            Your one-of-one — handcrafted in Los Angeles, made in 4–6 weeks.
          </p>
        </div>

        <div className="builder-review-details">
          <div className="builder-review-line">
            <div>
              <h3>{setting.name}</h3>
              <span className="builder-review-sku">Style {setting.sku}</span>
              {setting.collection && (
                <span className="builder-review-collection"> · {setting.collection}</span>
              )}
            </div>
            <span className="builder-review-price">
              ${settingPrice.toLocaleString('en-US')}
            </span>
          </div>

          <div className="builder-review-divider" />

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
              ${diamond.price_usd.toLocaleString('en-US')}
            </span>
          </div>

          <div className="builder-review-divider builder-review-divider-strong" />

          <div className="builder-review-totals">
            <div className="builder-review-total-row">
              <span>Commission total</span>
              <strong>${total.toLocaleString('en-US')}</strong>
            </div>
            <div className="builder-review-total-row builder-review-deposit">
              <span>50% deposit to begin</span>
              <strong>${deposit.toLocaleString('en-US')}</strong>
            </div>
            <p className="builder-review-balance">
              Balance of ${(total - deposit).toLocaleString('en-US')} due before shipping.
              Production: 4–6 weeks. Lifetime craftsmanship warranty.
            </p>
          </div>

          <div className="builder-review-form">
            <input
              type="email"
              placeholder="your@email.com"
              className="quote-lock-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button
              type="button"
              className="builder-cta-next builder-commission-btn"
              onClick={startCommission}
              disabled={loading}
            >
              {loading ? 'Opening secure checkout…' : 'Begin Commission →'}
            </button>
          </div>

          {err && <p className="quote-lock-err" style={{ marginTop: 8 }}>{err}</p>}

          <p className="builder-review-secured">
            Secured by Stripe · Your card is charged only when you confirm. We will email
            you the order reference and a specialist will reach out within one business
            day to confirm size, engraving, and stone details.
          </p>
        </div>
      </div>
    </div>
  );
}
