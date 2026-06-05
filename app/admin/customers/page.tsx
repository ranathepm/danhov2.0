import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CustomerRow = {
  email: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireAdmin();
  const sb = createServiceClient();

  let q = sb.from('customers').select('email, name, phone, notes, created_at').order('created_at', { ascending: false });
  if (searchParams.q) q = q.ilike('email', `%${searchParams.q}%`);
  const { data } = await q.limit(500);
  const customers: CustomerRow[] = (data as CustomerRow[]) ?? [];

  // Count orders per customer
  const emails = customers.map((c) => c.email);
  const { data: ordersByEmail } = emails.length
    ? await sb.from('orders').select('customer_email').in('customer_email', emails)
    : { data: [] as { customer_email: string }[] };
  const counts = new Map<string, number>();
  (ordersByEmail ?? []).forEach((o: { customer_email: string }) =>
    counts.set(o.customer_email, (counts.get(o.customer_email) ?? 0) + 1)
  );

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Customers</h1>
        <p className="adm-page-sub">{customers.length} shown</p>
      </header>

      <form className="adm-toolbar" method="get" action="/admin/customers">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search by email…"
          className="adm-input adm-toolbar-search"
        />
        <button type="submit" className="adm-btn">Filter</button>
      </form>

      <div className="adm-card adm-card--flush">
        {customers.length === 0 ? (
          <div className="adm-empty">No customers yet.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className="adm-mono">{c.email}</td>
                  <td>{c.name || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{counts.get(c.email) ?? 0}</td>
                  <td className="adm-page-sub">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
