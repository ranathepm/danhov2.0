import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ConsultationRow = {
  id: string;
  customer_email: string;
  customer_name: string | null;
  scheduled_at: string | null;
  status: string | null;
  zoom_link: string | null;
  notes: string | null;
  created_at: string;
};

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  await requireAdmin();
  const sb = createServiceClient();

  let query = sb
    .from('consultations')
    .select('id, customer_email, customer_name, scheduled_at, status, zoom_link, notes, created_at')
    .order('scheduled_at', { ascending: true, nullsFirst: false });

  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.q) {
    query = query.or(
      `customer_email.ilike.%${searchParams.q}%,customer_name.ilike.%${searchParams.q}%`
    );
  }

  const { data } = await query.limit(500);
  const rows: ConsultationRow[] = (data as ConsultationRow[]) ?? [];

  const STATUS_TABS = [
    { key: '',          label: 'All'       },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'completed', label: 'Completed' },
    { key: 'no_show',   label: 'No-show'   },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Consultations</h1>
        <p className="adm-page-sub">{rows.length} bookings</p>
      </header>

      {/* Status filter pills */}
      <div className="adm-filter-pills">
        {STATUS_TABS.map(({ key, label }) => {
          const q = searchParams.q ? `q=${encodeURIComponent(searchParams.q)}` : '';
          const href = key
            ? `/admin/consultations?status=${key}${q ? `&${q}` : ''}`
            : `/admin/consultations${q ? `?${q}` : ''}`;
          const active = (!searchParams.status && key === '') || searchParams.status === key;
          return (
            <a key={key || 'all'} href={href} className={`adm-filter-pill${active ? ' is-active' : ''}`}>
              {label}
            </a>
          );
        })}
      </div>

      {/* Search toolbar */}
      <form className="adm-toolbar" method="get" action="/admin/consultations">
        {searchParams.status && (
          <input type="hidden" name="status" value={searchParams.status} />
        )}
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search by name or email…"
          className="adm-input adm-toolbar-search"
        />
        <button type="submit" className="adm-btn adm-btn-primary">Search</button>
        {(searchParams.q || searchParams.status) && (
          <a href="/admin/consultations" className="adm-link">Reset</a>
        )}
      </form>

      <div className="adm-card adm-card--flush">
        {rows.length === 0 ? (
          <div className="adm-empty">No consultations yet — Calendly will sync here automatically.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Zoom</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.scheduled_at
                      ? new Date(c.scheduled_at).toLocaleString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: 'numeric', minute: 'numeric',
                        })
                      : '— pending —'}
                  </td>
                  <td>
                    <div>{c.customer_name || '—'}</div>
                    <div className="adm-mono adm-page-sub">{c.customer_email}</div>
                  </td>
                  <td><span className={`adm-pill adm-pill--${c.status?.replace(/_/g, '-') ?? 'scheduled'}`}>{c.status ?? 'scheduled'}</span></td>
                  <td>
                    {c.zoom_link ? (
                      <a href={c.zoom_link} target="_blank" rel="noopener noreferrer" className="adm-link">Join →</a>
                    ) : '—'}
                  </td>
                  <td className="adm-cell-notes">{c.notes || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
