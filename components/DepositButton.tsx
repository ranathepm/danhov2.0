'use client';

import { useState } from 'react';

type Props = {
  quoteId: string;
  email: string;
  className?: string;
};

export default function DepositButton({ quoteId, email, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId, email }),
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

  return (
    <>
      <button
        type="button"
        className={className ?? 'quote-lock-btn'}
        onClick={go}
        disabled={loading}
      >
        {loading ? 'Opening secure checkout…' : 'Pay 50% deposit →'}
      </button>
      {err && <span className="quote-lock-err" style={{ display: 'block', marginTop: 8 }}>{err}</span>}
    </>
  );
}
