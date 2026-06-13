'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

type OrderResult = {
  id: string;
  status: string;
  statusLabel: string;
  statusDescription: string;
  createdAt: string;
  updatedAt: string;
  productName: string | null;
  shippingName: string | null;
  total: number | null;
};

const STATUS_STEPS = [
  { key: 'pending',       label: 'Received' },
  { key: 'deposit_paid',  label: 'Confirmed' },
  { key: 'in_production', label: 'In Production' },
  { key: 'shipped',       label: 'Shipped' },
  { key: 'delivered',     label: 'Delivered' },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [orderId, setOrderId] = useState(searchParams.get('ref') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), order_id: orderId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('Unable to connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const stepIdx = order ? getStepIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled' || order?.status === 'failed';

  return (
    <main className="track-page">
      <style>{`
        .track-page { font-family: 'Cormorant Garamond', serif; color: #1a1410; background: #faf6f1; min-height: 100vh; }

        /* Hero */
        .track-hero {
          background: linear-gradient(160deg, #1a1410 0%, #2c1f18 60%, #3d2a20 100%);
          padding: 90px 24px 72px; text-align: center; position: relative; overflow: hidden;
        }
        .track-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 50% 40% at 50% 65%, rgba(172,52,56,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .track-eyebrow {
          display: block; font-size: 11px; letter-spacing: 0.22em;
          text-transform: uppercase; color: #AC3438; margin-bottom: 16px;
        }
        .track-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 5vw, 52px); font-weight: 400;
          color: #faf6f1; margin: 0 auto 16px; max-width: 600px; line-height: 1.15;
        }
        .track-hero-sub {
          font-size: 14px; color: #c4b8ad; max-width: 420px; margin: 0 auto; line-height: 1.6;
        }

        /* Form card */
        .track-form-wrap {
          max-width: 520px; margin: -32px auto 0;
          padding: 0 24px 64px; position: relative; z-index: 2;
        }
        .track-form-card {
          background: #fff; border-radius: 12px;
          box-shadow: 0 12px 48px rgba(26,20,16,0.14), 0 2px 8px rgba(0,0,0,0.06);
          padding: 40px 36px;
        }
        .track-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: #1a1410; margin-bottom: 28px; text-align: center;
        }
        .track-form { display: flex; flex-direction: column; gap: 16px; }
        .track-form-group { display: flex; flex-direction: column; gap: 6px; }
        .track-form-group label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7f76;
        }
        .track-form-group input {
          border: 1px solid #d4c9c0; border-radius: 6px;
          padding: 12px 14px; font-size: 14px; font-family: 'Cormorant Garamond', serif;
          color: #1a1410; outline: none; transition: border-color 0.15s;
        }
        .track-form-group input:focus { border-color: #AC3438; }
        .track-form-group input::placeholder { color: #b4a89d; }
        .track-submit {
          background: #1a1410; color: #faf6f1; border: none; border-radius: 999px;
          padding: 13px; font-size: 13px; font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
          transition: background 0.2s; margin-top: 4px;
        }
        .track-submit:hover:not(:disabled) { background: #8B2A2D; }
        .track-submit:disabled { background: #ccc4ba; cursor: default; }
        .track-error {
          background: rgba(172,52,56,0.08); border: 1px solid rgba(172,52,56,0.2);
          border-radius: 6px; padding: 12px 14px; font-size: 13.5px; color: #AC3438;
          line-height: 1.5; margin-top: 4px;
        }
        .track-hint {
          font-size: 12px; color: #9c8f86; text-align: center; margin-top: 16px; line-height: 1.5;
        }
        .track-hint a { color: #AC3438; text-decoration: none; }

        /* Result */
        .track-result { max-width: 640px; margin: 0 auto; padding: 0 24px 80px; }
        .track-result-card {
          background: #fff; border-radius: 12px;
          box-shadow: 0 8px 32px rgba(26,20,16,0.1);
          overflow: hidden;
        }
        .track-result-header {
          background: linear-gradient(135deg, #1a1410 0%, #2c1f18 100%);
          padding: 28px 32px;
        }
        .track-result-order-id { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8a7f76; margin-bottom: 4px; }
        .track-result-product {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: #faf6f1; margin-bottom: 2px;
        }
        .track-result-date { font-size: 12px; color: #8a7f76; }

        /* Progress bar */
        .track-progress { padding: 32px 32px 0; }
        .track-progress-label {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: #8a7f76; margin-bottom: 20px; display: block;
        }
        .track-steps { display: flex; align-items: flex-start; gap: 0; margin-bottom: 12px; }
        .track-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
        .track-step:not(:last-child)::after {
          content: '';
          position: absolute; top: 14px; left: 50%; right: -50%;
          height: 2px; background: #ede8e2; z-index: 0;
        }
        .track-step.done:not(:last-child)::after { background: #AC3438; }
        .track-step-dot {
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid #ede8e2; background: #fff;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; transition: all 0.2s;
          font-size: 11px; color: #ccc4ba;
        }
        .track-step.done .track-step-dot {
          border-color: #AC3438; background: #AC3438; color: #fff; font-size: 12px;
        }
        .track-step.current .track-step-dot {
          border-color: #AC3438; background: #fff; color: #AC3438; font-weight: 700;
        }
        .track-step-label {
          font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
          color: #ccc4ba; margin-top: 8px; text-align: center; line-height: 1.3;
        }
        .track-step.done .track-step-label,
        .track-step.current .track-step-label { color: #1a1410; }

        /* Status */
        .track-status-body { padding: 24px 32px 32px; }
        .track-status-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; color: #1a1410; margin-bottom: 6px;
        }
        .track-status-desc { font-size: 14px; color: #6b5e57; line-height: 1.65; margin-bottom: 20px; }
        .track-status-meta { font-size: 12px; color: #9c8f86; border-top: 1px solid #ede8e2; padding-top: 16px; }
        .track-status-meta p { margin-bottom: 4px; }

        /* Cancelled state */
        .track-cancelled .track-result-header { background: linear-gradient(135deg, #3d1515 0%, #2c1010 100%); }
        .track-status-label.cancelled { color: #AC3438; }

        @media (max-width: 480px) {
          .track-form-card { padding: 28px 20px; }
          .track-progress, .track-status-body { padding-left: 20px; padding-right: 20px; }
          .track-result-header { padding: 24px 20px; }
          .track-step-label { font-size: 9px; }
        }
      `}</style>

      {/* Hero */}
      <section className="track-hero">
        <span className="track-eyebrow">Order Tracking</span>
        <h1>Track Your Commission</h1>
        <p className="track-hero-sub">
          Follow your piece from the atelier bench to your door.
          Enter your email and order number from your confirmation.
        </p>
      </section>

      {/* Form */}
      {!order && (
        <div className="track-form-wrap">
          <div className="track-form-card">
            <p className="track-form-title">Look Up Your Order</p>
            <form className="track-form" onSubmit={handleSubmit}>
              <div className="track-form-group">
                <label htmlFor="track-email">Email Address</label>
                <input
                  id="track-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="The email you used at checkout"
                />
              </div>
              <div className="track-form-group">
                <label htmlFor="track-id">Order Number</label>
                <input
                  id="track-id"
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="From your confirmation email"
                />
              </div>
              {error && <p className="track-error">{error}</p>}
              <button type="submit" className="track-submit" disabled={loading}>
                {loading ? 'Looking up…' : 'Track Order'}
              </button>
            </form>
            <p className="track-hint">
              Order number is in your confirmation email from{' '}
              <a href="mailto:care@danhov.com">care@danhov.com</a>.{' '}
              Need help?{' '}
              <a href="mailto:care@danhov.com">Contact us</a>.
            </p>
          </div>
        </div>
      )}

      {/* Result */}
      {order && (
        <div className="track-result" style={{ paddingTop: 48 }}>
          <div className={`track-result-card${isCancelled ? ' track-cancelled' : ''}`}>
            {/* Header */}
            <div className="track-result-header">
              <p className="track-result-order-id">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="track-result-product">{order.productName ?? 'DANHOV Commission'}</p>
              <p className="track-result-date">Placed {formatDate(order.createdAt)}</p>
            </div>

            {/* Progress steps */}
            {!isCancelled && (
              <div className="track-progress">
                <span className="track-progress-label">Order Progress</span>
                <div className="track-steps">
                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i < stepIdx;
                    const isCurrent = i === stepIdx;
                    return (
                      <div
                        key={step.key}
                        className={`track-step${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`}
                      >
                        <div className="track-step-dot">
                          {isDone ? '✓' : i + 1}
                        </div>
                        <span className="track-step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status detail */}
            <div className="track-status-body">
              <p className={`track-status-label${isCancelled ? ' cancelled' : ''}`}>{order.statusLabel}</p>
              <p className="track-status-desc">{order.statusDescription}</p>
              <div className="track-status-meta">
                {order.shippingName && <p>Shipping to: {order.shippingName}</p>}
                {order.total && <p>Order total: ${order.total.toLocaleString('en-US', { minimumFractionDigits: 0 })}</p>}
                <p>Last updated: {formatDate(order.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button
              onClick={() => { setOrder(null); setEmail(''); setOrderId(''); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#AC3438', fontSize: 13, letterSpacing: '0.1em',
                textTransform: 'uppercase', textDecoration: 'underline',
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Track another order
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9c8f86', marginTop: 24, lineHeight: 1.6 }}>
            Questions? Our team is at{' '}
            <a href="mailto:care@danhov.com" style={{ color: '#AC3438', textDecoration: 'none' }}>care@danhov.com</a>{' '}
            or <a href="tel:+18883264687" style={{ color: '#AC3438', textDecoration: 'none' }}>(888) 326-4687</a>.
          </p>
        </div>
      )}
    </main>
  );
}
