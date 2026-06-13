'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart, formatUsd } from '@/components/CartProvider';
import { stripMetalSuffix } from '@/lib/product-display';

export type AccountOrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_usd: number;
  deposit_usd: number;
  shipping_cost_usd: number | null;
  product_name: string | null;
  product_sku: string | null;
  image: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  deposit_paid: 'Order confirmed',
  in_production: 'In production',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Payment failed',
};

function statusLabel(s: string): string {
  return STATUS_LABEL[s] ?? s.replace(/_/g, ' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AccountDashboard({
  email,
  userId,
  orders,
}: {
  email: string;
  userId: string;
  orders: AccountOrderRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { items: cartItems, count: cartCount, subtotal, removeItem } = useCart();

  function onSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push('/');
    });
  }

  return (
    <main className="account-page account-page--wide">
      <div className="account-card sacred-glow">
        <header className="account-header">
          <div>
            <div className="account-eyebrow">— Your DANHOV account</div>
            <h1 className="account-title">Welcome.</h1>
            <p className="account-body">
              Signed in as <strong>{email}</strong>.
            </p>
          </div>
          <button
            type="button"
            className="account-signout"
            onClick={onSignOut}
            disabled={pending}
          >
            {pending ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        {/* ── Cart ──────────────────────────────────────────────── */}
        <section className="acct-section">
          <div className="acct-section-head">
            <h2 className="acct-section-title">Your cart</h2>
            <span className="acct-section-sub">
              {cartCount === 0
                ? 'No pieces saved yet.'
                : `${cartCount} ${cartCount === 1 ? 'piece' : 'pieces'} · ${subtotal > 0 ? formatUsd(subtotal) : 'Inquire'}`}
            </span>
          </div>

          {cartItems.length === 0 ? (
            <div className="acct-empty">
              <p>Pieces you save will appear here.</p>
              <Link href="/engagement-rings" className="btn-primary">Browse Engagement</Link>
            </div>
          ) : (
            <ul className="acct-cart-list">
              {cartItems.map((it) => (
                <li key={it.id} className="acct-cart-row">
                  <Link href={`/product/${it.slug}`} className="acct-cart-media">
                    {it.image ? (
                      <Image src={it.image} alt={it.name} width={84} height={84} />
                    ) : (
                      <div className="acct-cart-media-fallback" aria-hidden="true">◇</div>
                    )}
                  </Link>
                  <div className="acct-cart-body">
                    <Link href={`/product/${it.slug}`} className="acct-cart-name">
                      {stripMetalSuffix(it.name)}
                    </Link>
                    <div className="acct-cart-meta">
                      <span>Style {it.sku}</span>
                      {it.metal && <span>· {it.metal.replace(/_/g, ' ')}</span>}
                      {it.ring_size && <span>· Size {it.ring_size}</span>}
                      <span>· Qty {it.qty}</span>
                    </div>
                  </div>
                  <div className="acct-cart-side">
                    <span className="acct-cart-price">
                      {it.price_num > 0 ? formatUsd(it.price_num * it.qty) : 'Inquire'}
                    </span>
                    <button
                      type="button"
                      className="acct-cart-remove"
                      onClick={() => removeItem(it.id)}
                      aria-label={`Remove ${it.name}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {cartItems.length > 0 && (
            <div className="acct-section-actions">
              <Link href="/cart" className="btn-primary">View full cart</Link>
              <Link href="/engagement-rings" className="btn-solid">Continue browsing</Link>
            </div>
          )}
        </section>

        {/* ── Order history ─────────────────────────────────────── */}
        <section className="acct-section">
          <div className="acct-section-head">
            <h2 className="acct-section-title">Order history</h2>
            <span className="acct-section-sub">
              {orders.length === 0
                ? 'No orders yet.'
                : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="acct-empty">
              <p>Your past orders will appear here.</p>
            </div>
          ) : (
            <ul className="acct-orders">
              {orders.map((o) => {
                const ref = o.id.slice(0, 8).toUpperCase();
                return (
                  <li key={o.id} className="acct-order">
                    <div className="acct-order-media">
                      {o.image ? (
                        <Image src={o.image} alt={o.product_name ?? ref} width={84} height={84} />
                      ) : (
                        <div className="acct-cart-media-fallback" aria-hidden="true">◇</div>
                      )}
                    </div>
                    <div className="acct-order-body">
                      <div className="acct-order-head">
                        <div className="acct-order-ref">DH-{ref}</div>
                        <span className={`acct-order-status acct-order-status--${o.status}`}>
                          {statusLabel(o.status)}
                        </span>
                      </div>
                      <div className="acct-order-name">
                        {o.product_name ?? 'Custom DANHOV piece'}
                        {o.product_sku ? <span className="acct-order-sku"> · Style {o.product_sku}</span> : null}
                      </div>
                      <div className="acct-order-meta">
                        {formatDate(o.created_at)}
                        {' · '}
                        Total {formatUsd(o.total_usd)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="account-fineprint">
          Account id: <span className="account-id">{userId}</span>
        </p>
      </div>
    </main>
  );
}
