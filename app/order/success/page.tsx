import Link from 'next/link';
import { finalizeCheckoutSession } from '@/lib/checkout-finalize';
import CartClearOnSuccess from '@/components/CartClearOnSuccess';
import StripeHistoryFix from '@/components/StripeHistoryFix';

export const metadata = { title: 'Order received — DANHOV' };
export const dynamic = 'force-dynamic';

type Search = { session_id?: string };

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sessionId = searchParams.session_id;
  // Belt-and-suspenders reconciliation: even if the Stripe webhook
  // hasn't fired yet (or is misconfigured), this re-confirms the
  // session with Stripe and flips our order from pending → deposit_paid
  // before we render. Idempotent — safe to call on every page load.
  const result = sessionId
    ? await finalizeCheckoutSession(sessionId)
    : { status: 'not_found' as const };

  const reference = result.order_id?.slice(0, 8).toUpperCase() ?? '';
  const depositUsd = result.deposit_usd ?? null;
  const productName = result.product_name ?? null;
  const paid = result.status === 'completed';

  return (
    <main style={{ padding: '160px 24px 120px', textAlign: 'center', minHeight: '70vh' }}>
      {/* Clear the customer's localStorage cart now that the deposit
          is recorded. Renders only when we've actually confirmed
          payment so a stray /order/success visit without a paid
          session can't wipe an in-progress cart. */}
      {paid && <CartClearOnSuccess />}
      {/* Prevent browser "back" from returning to the Stripe checkout page. */}
      <StripeHistoryFix />

      <span className="section-eyebrow">Commission Confirmed</span>
      <h1 className="section-title" style={{ marginTop: 24 }}>
        Your <em>journey</em> has begun.
      </h1>
      <p className="section-body" style={{ marginTop: 28, maxWidth: 580 }}>
        Thank you. Your order secures the craftsmanship of {productName ? <em>{productName}</em> : 'your piece'}.
        A DANHOV specialist will be in touch within one business day to confirm every detail.
      </p>

      {reference && (
        <div
          style={{
            display: 'inline-block',
            marginTop: 36,
            padding: '20px 36px',
            background: '#fdf0ed',
            border: '1px solid rgba(172,52,56,0.18)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--logo-red)',
            }}
          >
            Order Reference
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: "'Cormorant Garamond', serif",
              color: 'var(--logo-red)',
              marginTop: 6,
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}
          >
            {reference}
          </div>
          {depositUsd && (
            <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 4 }}>
              Amount paid · ${depositUsd.toLocaleString('en-US')}
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: 36, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, color: '#7a5c58' }}>
        &ldquo;Presence is a present.&rdquo;
      </p>

      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {reference && (
          <Link
            href={`/track-order?ref=${reference}`}
            style={{
              display: 'inline-block',
              padding: '14px 40px',
              background: '#AC3438',
              color: '#fff',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: 999,
            }}
          >
            Track Your Order
          </Link>
        )}
        <Link href="/" className="btn-primary">Return Home</Link>
      </div>
    </main>
  );
}
