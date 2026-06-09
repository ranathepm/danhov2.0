import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import OrdersTable from '@/components/admin/OrdersTable';

export const dynamic = 'force-dynamic';

type Search = { status?: string; q?: string };

const STATUSES = [
  'pending', 'deposit_paid', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed',
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  await requireAdmin();
  const sb = createServiceClient();

  let q = sb
    .from('orders')
    .select('id, customer_email, total_usd, deposit_usd, status, created_at, stripe_payment_intent_id, currency, shipping_country, milestones')
    .order('created_at', { ascending: false });
  if (searchParams.status) q = q.eq('status', searchParams.status);
  if (searchParams.q) q = q.ilike('customer_email', `%${searchParams.q}%`);
  const { data: orders } = await q.limit(500);

  const qStr = searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : '';

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Orders</h1>
        <p className="adm-page-sub">{(orders ?? []).length} shown</p>
      </header>

      {/* Status filter pills */}
      <div className="adm-filter-pills">
        <a
          href={`/admin/orders${searchParams.q ? `?q=${encodeURIComponent(searchParams.q)}` : ''}`}
          className={`adm-filter-pill${!searchParams.status ? ' is-active' : ''}`}
        >
          All
        </a>
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/orders?status=${s}${qStr}`}
            className={`adm-filter-pill${searchParams.status === s ? ' is-active' : ''}`}
          >
            {s.replace(/_/g, ' ')}
          </a>
        ))}
      </div>

      {/* Search toolbar */}
      <form className="adm-toolbar" method="get" action="/admin/orders">
        {searchParams.status && (
          <input type="hidden" name="status" value={searchParams.status} />
        )}
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search by email…"
          className="adm-input adm-toolbar-search"
        />
        <button type="submit" className="adm-btn adm-btn-primary">Search</button>
        {(searchParams.q || searchParams.status) && (
          <a href="/admin/orders" className="adm-link">Reset</a>
        )}
      </form>

      <OrdersTable orders={orders ?? []} statuses={STATUSES} />
    </div>
  );
}
