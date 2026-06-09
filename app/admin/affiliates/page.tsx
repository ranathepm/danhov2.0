import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import AffiliateActions from './AffiliateActions';

export const metadata: Metadata = { title: 'Affiliates · DANHOV Admin' };
export const dynamic = 'force-dynamic';

type AffApp = {
  id: string;
  name: string;
  email: string;
  platform: string | null;
  audience_size: string | null;
  website: string | null;
  about: string | null;
  status: string;
  created_at: string;
};

const STATUS_TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const sb = createServiceClient();

  let query = sb
    .from('affiliate_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }
  if (searchParams.q) {
    query = query.or(`name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }

  const { data: apps, error } = await query.limit(200);

  const counts: Record<string, number> = { all: 0, pending: 0, approved: 0, rejected: 0 };
  if (apps) {
    (apps as AffApp[]).forEach((a) => {
      counts.all++;
      if (a.status in counts) counts[a.status]++;
    });
  }

  function pillHref(key: string) {
    const q = searchParams.q ? `q=${encodeURIComponent(searchParams.q)}` : '';
    if (key === 'all') return `/admin/affiliates${q ? `?${q}` : ''}`;
    return `/admin/affiliates?status=${key}${q ? `&${q}` : ''}`;
  }

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Affiliate Applications</h1>
        <p className="adm-page-sub">{counts.all} total · {counts.pending} pending review</p>
      </header>

      {/* Status filter pills */}
      <div className="adm-filter-pills">
        {STATUS_TABS.map((tab) => {
          const active =
            (!searchParams.status && tab.key === 'all') ||
            searchParams.status === tab.key;
          return (
            <a
              key={tab.key}
              href={pillHref(tab.key)}
              className={`adm-filter-pill${active ? ' is-active' : ''}`}
            >
              {tab.label}
              <span className="adm-filter-pill-count">{counts[tab.key] ?? 0}</span>
            </a>
          );
        })}
      </div>

      {/* Search toolbar */}
      <form className="adm-toolbar" method="GET" action="/admin/affiliates">
        {searchParams.status && (
          <input type="hidden" name="status" value={searchParams.status} />
        )}
        <input
          className="adm-input adm-toolbar-search"
          name="q"
          placeholder="Search by name or email…"
          defaultValue={searchParams.q}
        />
        <button type="submit" className="adm-btn adm-btn-primary">Search</button>
        {searchParams.q && (
          <a
            href={`/admin/affiliates${searchParams.status ? `?status=${searchParams.status}` : ''}`}
            className="adm-link"
          >
            Clear
          </a>
        )}
      </form>

      {error && (
        <p className="adm-form-err">Error loading applications: {error.message}</p>
      )}

      <div className="adm-card adm-card--flush">
        {!apps || apps.length === 0 ? (
          <div className="adm-empty">No affiliate applications found.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Platform</th>
                <th>Audience</th>
                <th>Website</th>
                <th>About</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(apps as AffApp[]).map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.name}</td>
                  <td>
                    <a href={`mailto:${app.email}`} className="adm-link">
                      {app.email}
                    </a>
                  </td>
                  <td className="adm-page-sub">{app.platform || '—'}</td>
                  <td className="adm-page-sub">{app.audience_size || '—'}</td>
                  <td>
                    {app.website ? (
                      <a
                        href={app.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="adm-link"
                        style={{ fontSize: 12 }}
                      >
                        Visit ↗
                      </a>
                    ) : '—'}
                  </td>
                  <td className="adm-cell-notes">{app.about || '—'}</td>
                  <td>
                    <span className={`adm-pill adm-pill--${app.status}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--adm-mute)', whiteSpace: 'nowrap' }}>
                      {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td>
                    <AffiliateActions
                      id={app.id}
                      currentStatus={app.status}
                      email={app.email}
                      name={app.name}
                    />
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
