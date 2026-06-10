'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, formatUsd } from '@/components/CartProvider';
import { createClient } from '@/lib/supabase/client';
import { stripMetalSuffix } from '@/lib/product-display';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CartPageClient() {
  const router = useRouter();
  void router;
  const { items, count, subtotal, removeItem, setQty, clear } = useCart();
  const [email, setEmail] = useState<string>('');
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Guest checkout: no sign-in required. If the visitor happens to be
  // signed in we prefill their email as a convenience, but anyone can
  // check out by entering an email below — the cart lives in localStorage.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user?.email) setEmail((e) => e || data.user!.email!);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user?.email) setEmail((e) => e || session.user!.email!);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const emailValid = EMAIL_RE.test(email.trim());

  async function startCheckout() {
    if (!emailValid) {
      setCheckoutError('Please enter your email so we can send your order confirmation.');
      return;
    }
    if (items.length === 0) return;
    setCheckoutPending(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          items: items.map((it) => ({
            sku: it.sku,
            slug: it.slug,
            qty: it.qty,
            metal: it.metal ?? null,
            ring_size: it.ring_size ?? null,
            bundle: it.bundle ?? null,
          })),
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !payload.url) {
        setCheckoutError(
          payload.error || 'We couldn’t open the secure checkout. Please try again.'
        );
        setCheckoutPending(false);
        return;
      }
      // Redirect into Stripe Checkout
      window.location.href = payload.url;
    } catch {
      setCheckoutError('We couldn’t reach the checkout server. Please try again.');
      setCheckoutPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty-card">
          <div className="cart-page-eyebrow">— Your Cart</div>
          <h1 className="cart-page-title">Your cart is empty.</h1>
          <p className="cart-page-body">
            Each DANHOV piece is handcrafted to order in Los Angeles. Begin
            with our engagement collection, or build a custom ring from
            scratch.
          </p>
          <div className="cart-empty-actions">
            <Link href="/engagement-rings" className="btn-primary">
              Browse Engagement
            </Link>
            <Link href="/ring-builder" className="btn-solid">
              Build a Ring
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const mailBody = encodeURIComponent(
    [
      "I'd like to inquire about the following pieces in my cart:",
      '',
      ...items.map(
        (it) =>
          `• ${stripMetalSuffix(it.name)} (Style ${it.sku})${it.metal ? ` — ${it.metal}` : ''}` +
          (it.qty > 1 ? ` × ${it.qty}` : '') +
          (it.price_display ? ` — ${it.price_display}` : '')
      ),
      '',
      subtotal > 0 ? `Estimated subtotal: ${formatUsd(subtotal)}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
  const mailto = `mailto:care@danhov.com?subject=${encodeURIComponent('Cart Inquiry — DANHOV')}&body=${mailBody}`;

  return (
    <main className="cart-page">
      <header className="cart-page-head">
        <div className="cart-page-eyebrow">— Your Cart</div>
        <h1 className="cart-page-title">
          {count} {count === 1 ? 'piece' : 'pieces'} reserved
        </h1>
        <p className="cart-page-sub">
          Each piece is handcrafted to order in Los Angeles. Your specialist
          confirms availability and locks final pricing within 24 hours.
        </p>
      </header>

      <div className="cart-grid">
        <section className="cart-items" aria-label="Cart items">
          {items.map((it) => (
            <article key={it.id} className="cart-row">
              <Link href={`/product/${it.slug}`} className="cart-row-media">
                {it.image ? (
                  <Image
                    src={it.image}
                    alt={it.name}
                    width={160}
                    height={160}
                    sizes="160px"
                  />
                ) : (
                  <div className="cart-row-media-fallback">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 9l6-6 6 6-6 12L6 9z" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  </div>
                )}
              </Link>
              <div className="cart-row-body">
                <div className="cart-row-top">
                  <div>
                    {it.collection && (
                      <div className="cart-row-coll">{it.collection}</div>
                    )}
                    <Link href={`/product/${it.slug}`} className="cart-row-name">
                      {stripMetalSuffix(it.name)}
                    </Link>
                    <div className="cart-row-meta">
                      <span>Style {it.sku}</span>
                      {it.metal && <span>· {it.metal}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-row-remove"
                    onClick={() => removeItem(it.id)}
                    aria-label={`Remove ${it.name}`}
                  >
                    Remove
                  </button>
                </div>
                <div className="cart-row-bottom">
                  <div className="cart-row-qty">
                    <button type="button" onClick={() => setQty(it.id, it.qty - 1)} aria-label="Decrease">−</button>
                    <span aria-live="polite">{it.qty}</span>
                    <button type="button" onClick={() => setQty(it.id, it.qty + 1)} aria-label="Increase">+</button>
                  </div>
                  <div className="cart-row-price">
                    {it.price_num > 0 ? formatUsd(it.price_num * it.qty) : 'Price on inquiry'}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <button type="button" className="cart-clear" onClick={clear}>
            Clear cart
          </button>
        </section>

        <aside className="cart-summary" aria-label="Order summary">
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Summary</h2>
            <div className="cart-summary-row">
              <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
              <span>{subtotal > 0 ? formatUsd(subtotal) : 'Inquire'}</span>
            </div>
            <div className="cart-summary-row cart-summary-row--muted">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="cart-summary-row cart-summary-row--muted">
              <span>Tax</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="cart-summary-rule" />
            <div className="cart-summary-row cart-summary-row--total">
              <span>Estimated total</span>
              <span>{subtotal > 0 ? formatUsd(subtotal) : 'Inquire'}</span>
            </div>



            {/* Guest checkout — just an email, no account required. The
                confirmation + specialist follow-up go to this address; Stripe
                also collects it on the payment page. */}
            <label className="cart-summary-email">
              <span>Email for your order confirmation</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setCheckoutError(null); }}
              />
            </label>

            <button
              type="button"
              className="btn-primary cart-summary-cta"
              onClick={startCheckout}
              disabled={checkoutPending || items.length === 0 || !emailValid}
            >
              {checkoutPending
                ? 'Opening secure checkout…'
                : `Place Order ${subtotal > 0 ? `· ${formatUsd(subtotal)}` : ''}`}
            </button>

            {checkoutError && (
              <p className="cart-summary-err" role="alert">{checkoutError}</p>
            )}

            <a href={mailto} className="btn-solid cart-summary-cta">
              Or Inquire by Email
            </a>
            <Link href="/engagement-rings" className="cart-summary-link">
              Continue browsing →
            </Link>

            <p className="cart-summary-note">
              Each DANHOV piece is handcrafted to order in Los Angeles — your
              specialist confirms timeline within one business day of payment.
              Payments processed securely via Stripe.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
