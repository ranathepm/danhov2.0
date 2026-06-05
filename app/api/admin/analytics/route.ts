/**
 * Admin analytics — aggregate sales by date range.
 *
 * GET /api/admin/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns:
 *   - totals (revenue, orders, deposits, balance, AOV)
 *   - by_day (one row per day in the range, even days with zero orders)
 *   - by_status (count + total per status)
 *   - top_products (top 5 by revenue in the range)
 *   - recent (10 most recent orders in the range)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Q = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type OrderRow = {
  id: string;
  customer_email: string | null;
  total_usd: number | null;
  deposit_usd: number | null;
  status: string;
  created_at: string;
  product_sku: string | null;
  product_name: string | null;
  quote_lock_id: string | null;
};

const COUNTED_STATUSES = new Set([
  'deposit_paid', 'in_production', 'shipped', 'delivered',
]);

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const parsed = Q.safeParse({
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid from/to' }, { status: 400 });
  }

  const fromDate = new Date(parsed.data.from + 'T00:00:00Z');
  const toDate = new Date(parsed.data.to + 'T23:59:59.999Z');
  if (toDate < fromDate) {
    return NextResponse.json({ error: 'to must be on/after from' }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('orders')
    .select('id, customer_email, total_usd, deposit_usd, status, created_at, product_sku, product_name, quote_lock_id')
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = (data ?? []) as OrderRow[];

  // ── Totals ──────────────────────────────────────────────────────────
  let revenue = 0;
  let deposits = 0;
  let balance = 0;
  let counted = 0;
  let canceledCount = 0;
  let canceledRevenue = 0;
  for (const o of orders) {
    const total = Number(o.total_usd ?? 0);
    const dep = Number(o.deposit_usd ?? 0);
    if (o.status === 'cancelled' || o.status === 'failed') {
      canceledCount++;
      canceledRevenue += total;
      continue;
    }
    if (COUNTED_STATUSES.has(o.status)) {
      revenue += total;
      deposits += dep;
      balance += Math.max(0, total - dep);
      counted++;
    }
  }

  const aov = counted > 0 ? revenue / counted : 0;

  // ── By day ──────────────────────────────────────────────────────────
  const dayBucket = new Map<string, { revenue: number; orders: number }>();
  // seed every day in the range so zero-days appear in the chart
  for (let d = new Date(fromDate); d <= toDate; d.setUTCDate(d.getUTCDate() + 1)) {
    dayBucket.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    if (o.status === 'cancelled' || o.status === 'failed') continue;
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    const b = dayBucket.get(day) ?? { revenue: 0, orders: 0 };
    if (COUNTED_STATUSES.has(o.status)) b.revenue += Number(o.total_usd ?? 0);
    b.orders += 1;
    dayBucket.set(day, b);
  }
  const by_day = Array.from(dayBucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({ date, revenue: Math.round(b.revenue), orders: b.orders }));

  // ── By status ───────────────────────────────────────────────────────
  const statusBucket = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const s = statusBucket.get(o.status) ?? { count: 0, total: 0 };
    s.count++;
    s.total += Number(o.total_usd ?? 0);
    statusBucket.set(o.status, s);
  }
  const by_status = Array.from(statusBucket.entries())
    .map(([status, b]) => ({ status, count: b.count, total: Math.round(b.total) }))
    .sort((a, b) => b.total - a.total);

  // ── Top products ────────────────────────────────────────────────────
  const productBucket = new Map<string, { name: string; sku: string; count: number; total: number }>();
  for (const o of orders) {
    if (!COUNTED_STATUSES.has(o.status)) continue;
    const sku = o.product_sku ?? 'unknown';
    const name = o.product_name ?? 'Custom commission';
    const p = productBucket.get(sku) ?? { name, sku, count: 0, total: 0 };
    p.count++;
    p.total += Number(o.total_usd ?? 0);
    productBucket.set(sku, p);
  }

  // Fetch the matching products' accounting cost + sales price so each
  // top-products row can show internal-cost vs. sales-price columns.
  const skus = Array.from(productBucket.keys()).filter((s) => s !== 'unknown');
  const costMap = new Map<string, { cost: number; sales: number }>();
  if (skus.length > 0) {
    const { data: prodRows } = await sb
      .from('products')
      .select('sku, accounting_cost_usd, price_display')
      .in('sku', skus);
    for (const row of (prodRows ?? []) as { sku: string; accounting_cost_usd: number | null; price_display: string | null }[]) {
      const m = row.price_display?.match(/[\d,]+(?:\.\d+)?/);
      const sales = m ? Number(m[0].replace(/,/g, '')) : 0;
      costMap.set(row.sku, {
        cost: Number(row.accounting_cost_usd ?? 0),
        sales,
      });
    }
  }
  const top_products = Array.from(productBucket.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((p) => ({
      ...p,
      total: Math.round(p.total),
      accounting_cost_usd: Math.round(costMap.get(p.sku)?.cost ?? 0),
      sales_price_usd: Math.round(costMap.get(p.sku)?.sales ?? 0),
    }));

  // ── Recent orders (within range) ────────────────────────────────────
  const recent = orders.slice(0, 10).map((o) => ({
    id: o.id,
    ref: String(o.id).slice(0, 8).toUpperCase(),
    customer_email: o.customer_email,
    total_usd: Number(o.total_usd ?? 0),
    deposit_usd: Number(o.deposit_usd ?? 0),
    status: o.status,
    created_at: o.created_at,
    product_name: o.product_name,
  }));

  return NextResponse.json({
    range: { from: parsed.data.from, to: parsed.data.to },
    totals: {
      revenue: Math.round(revenue),
      deposits: Math.round(deposits),
      balance_pending: Math.round(balance),
      orders: counted,
      avg_order_value: Math.round(aov),
      cancelled_count: canceledCount,
      cancelled_revenue: Math.round(canceledRevenue),
    },
    by_day,
    by_status,
    top_products,
    recent,
  });
}
