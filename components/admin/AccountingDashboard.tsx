'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { stripMetalSuffix } from '@/lib/product-display';

type Totals = {
  revenue: number;
  deposits: number;
  balance_pending: number;
  orders: number;
  avg_order_value: number;
  cancelled_count: number;
  cancelled_revenue: number;
};

type ByDay = { date: string; revenue: number; orders: number };
type ByStatus = { status: string; count: number; total: number };
type TopProduct = {
  sku: string;
  name: string;
  count: number;
  total: number;
  accounting_cost_usd: number;
  sales_price_usd: number;
};
type Recent = {
  id: string;
  ref: string;
  customer_email: string | null;
  total_usd: number;
  deposit_usd: number;
  status: string;
  created_at: string;
  product_name: string | null;
};

type Analytics = {
  range: { from: string; to: string };
  totals: Totals;
  by_day: ByDay[];
  by_status: ByStatus[];
  top_products: TopProduct[];
  recent: Recent[];
};

type Preset = 'today' | 'yesterday' | 'this_week' | 'last_7' | 'this_month' | 'last_month' | 'last_30' | 'this_year' | 'all' | 'custom';

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
function firstOfMonth(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths, 1);
  return d.toISOString().slice(0, 10);
}
function lastOfMonth(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths + 1, 0);
  return d.toISOString().slice(0, 10);
}
function firstOfWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // start week on Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(p: Preset): { from: string; to: string } {
  switch (p) {
    case 'today':       return { from: todayISO(0), to: todayISO(0) };
    case 'yesterday':   return { from: todayISO(-1), to: todayISO(-1) };
    case 'this_week':   return { from: firstOfWeek(), to: todayISO(0) };
    case 'last_7':      return { from: todayISO(-6), to: todayISO(0) };
    case 'this_month':  return { from: firstOfMonth(0), to: todayISO(0) };
    case 'last_month':  return { from: firstOfMonth(-1), to: lastOfMonth(-1) };
    case 'last_30':     return { from: todayISO(-29), to: todayISO(0) };
    case 'this_year':   return { from: new Date().getFullYear() + '-01-01', to: todayISO(0) };
    case 'all':         return { from: '2020-01-01', to: todayISO(0) };
    default:            return { from: todayISO(-29), to: todayISO(0) };
  }
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

export default function AccountingDashboard() {
  const initial = rangeForPreset('last_30');
  const [preset, setPreset] = useState<Preset>('last_30');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Analytics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === 'custom') return;
    const r = rangeForPreset(p);
    setFrom(r.from);
    setTo(r.to);
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/analytics?from=${from}&to=${to}`, {
        cache: 'no-store',
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `Failed (${r.status})`);
      const json = (await r.json()) as Analytics;
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  // Auto-load when range changes (via preset OR custom inputs)
  useEffect(() => {
    if (!from || !to) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const maxRev = useMemo(() => {
    if (!data) return 0;
    return Math.max(1, ...data.by_day.map((d) => d.revenue));
  }, [data]);

  function csvExport() {
    if (!data) return;
    const lines = [
      'Date,Revenue (USD),Orders',
      ...data.by_day.map((d) => `${d.date},${d.revenue},${d.orders}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danhov-sales-${data.range.from}_to_${data.range.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Filter bar */}
      <section className="adm-card">
        <div className="adm-acc-filters">
          <div className="adm-acc-presets">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`adm-chip${preset === p.value ? ' is-active' : ''}`}
                onClick={() => applyPreset(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="adm-acc-dates">
            <label className="adm-field adm-field--inline">
              <span>From</span>
              <input
                type="date"
                className="adm-input adm-input--sm"
                value={from}
                onChange={(e) => { setPreset('custom'); setFrom(e.target.value); }}
              />
            </label>
            <label className="adm-field adm-field--inline">
              <span>To</span>
              <input
                type="date"
                className="adm-input adm-input--sm"
                value={to}
                onChange={(e) => { setPreset('custom'); setTo(e.target.value); }}
              />
            </label>
            <button type="button" className="adm-btn" onClick={csvExport} disabled={!data}>
              Export CSV
            </button>
          </div>
        </div>
      </section>

      {err && <div className="adm-card adm-empty" style={{ color: '#AC3438' }}>{err}</div>}

      {/* KPIs */}
      {data && (
        <section className="adm-kpis">
          <Kpi label="Net revenue" value={`$${data.totals.revenue.toLocaleString('en-US')}`} hint={`${data.totals.orders} paid orders`} />
          <Kpi label="Deposits collected" value={`$${data.totals.deposits.toLocaleString('en-US')}`} />
          <Kpi label="Balance pending" value={`$${data.totals.balance_pending.toLocaleString('en-US')}`} />
          <Kpi label="Avg order value" value={`$${data.totals.avg_order_value.toLocaleString('en-US')}`} />
          {data.totals.cancelled_count > 0 && (
            <Kpi
              label="Cancelled / failed"
              value={`${data.totals.cancelled_count}`}
              hint={`$${data.totals.cancelled_revenue.toLocaleString('en-US')} lost`}
              tone="warn"
            />
          )}
        </section>
      )}

      {/* Chart */}
      {data && data.by_day.length > 0 && (
        <section className="adm-card">
          <h3 className="adm-h3">Daily revenue</h3>
          <p className="adm-page-sub" style={{ marginTop: -4, marginBottom: 12 }}>
            {data.range.from} → {data.range.to} · hover a bar for the day total.
          </p>
          <div className="adm-chart">
            {data.by_day.map((d) => {
              const h = Math.max(2, Math.round((d.revenue / maxRev) * 140));
              return (
                <div key={d.date} className="adm-chart-col" title={`${d.date} · $${d.revenue.toLocaleString('en-US')} · ${d.orders} order${d.orders === 1 ? '' : 's'}`}>
                  <div className="adm-chart-bar" style={{ height: `${h}px` }} />
                  <div className="adm-chart-x">{d.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="adm-detail-grid">
        {/* Top products */}
        <section className="adm-card">
          <h3 className="adm-h3">Top pieces</h3>
          {data && data.top_products.length > 0 ? (
            <table className="adm-table adm-table--compact">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th style={{ textAlign: 'right' }}>Sold</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                  <th style={{ textAlign: 'right' }}>Sales price</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p) => (
                  <tr key={p.sku}>
                    <td>{stripMetalSuffix(p.name)} <span className="adm-page-sub">· {p.sku}</span></td>
                    <td style={{ textAlign: 'right' }}>{p.count}</td>
                    <td style={{ textAlign: 'right' }}>
                      {p.accounting_cost_usd > 0
                        ? `$${p.accounting_cost_usd.toLocaleString('en-US')}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.sales_price_usd > 0
                        ? `$${p.sales_price_usd.toLocaleString('en-US')}`
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>${p.total.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="adm-empty">No sales in this range.</div>
          )}
        </section>

        {/* By status */}
        <section className="adm-card">
          <h3 className="adm-h3">By status</h3>
          {data && data.by_status.length > 0 ? (
            <table className="adm-table adm-table--compact">
              <thead>
                <tr>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.by_status.map((s) => (
                  <tr key={s.status}>
                    <td>{s.status.replace(/_/g, ' ')}</td>
                    <td style={{ textAlign: 'right' }}>{s.count}</td>
                    <td style={{ textAlign: 'right' }}>${s.total.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="adm-empty">No orders in this range.</div>
          )}
        </section>
      </div>

      {/* Recent orders */}
      {data && data.recent.length > 0 && (
        <section className="adm-card">
          <h3 className="adm-h3">Recent orders in range</h3>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Customer</th>
                <th>Piece</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((o) => (
                <tr key={o.id}>
                  <td className="adm-mono">{o.ref}</td>
                  <td>{o.customer_email ?? '—'}</td>
                  <td>{o.product_name ?? '—'}</td>
                  <td>${o.total_usd.toLocaleString('en-US')}</td>
                  <td>{o.status.replace(/_/g, ' ')}</td>
                  <td className="adm-page-sub">
                    {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td><Link href={`/admin/orders/${o.id}`} className="adm-link">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {loading && <div className="adm-page-sub" style={{ textAlign: 'center', padding: 8 }}>Loading…</div>}
    </>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'warn' }) {
  return (
    <div className={`adm-kpi${tone === 'warn' ? ' adm-kpi--warn' : ''}`}>
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-value">{value}</div>
      {hint && <div className="adm-kpi-hint">{hint}</div>}
    </div>
  );
}
