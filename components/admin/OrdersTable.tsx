'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Order = {
  id: string;
  customer_email: string;
  total_usd: number | null;
  deposit_usd: number | null;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string | null;
  currency: string | null;
  shipping_country: string | null;
  milestones: unknown;
};

export default function OrdersTable({
  orders,
  statuses,
}: {
  orders: Order[];
  statuses: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  function flash(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      flash('ok', 'Status updated');
      router.refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      flash('ok', 'Order deleted');
      router.refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  if (orders.length === 0) {
    return <div className="adm-card adm-card--flush"><div className="adm-empty">No orders match.</div></div>;
  }

  return (
    <>
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}
      <div className="adm-card adm-card--flush">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Deposit</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="adm-mono">{o.id.slice(0, 8).toUpperCase()}</td>
                <td>{o.customer_email}</td>
                <td>${Number(o.total_usd ?? 0).toLocaleString('en-US')}</td>
                <td>${Number(o.deposit_usd ?? 0).toLocaleString('en-US')}</td>
                <td>
                  <select
                    className="adm-select adm-select--sm"
                    value={o.status}
                    disabled={busy === o.id}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </td>
                <td className="adm-page-sub">
                  {new Date(o.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric',
                  })}
                </td>
                <td className="adm-cell-actions">
                  <Link href={`/admin/orders/${o.id}`} className="adm-link">View</Link>
                  <button
                    type="button"
                    className="adm-link adm-link--danger"
                    disabled={busy === o.id}
                    onClick={() => remove(o.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
