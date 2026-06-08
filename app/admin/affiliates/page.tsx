import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import AffiliateActions from './AffiliateActions';

export const metadata: Metadata = { title: 'Affiliates · DANHOV Admin' };
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending: '#AC3438',
  approved: '#2a7a2a',
  rejected: '#AC3438',
};

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
    query = query.or(
      `name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`
    );
  }

  const { data: apps, error } = await query.limit(200);

  const counts = {
    pending: 0, approved: 0, rejected: 0, all: 0,
  };
  if (apps) {
    apps.forEach((a: { status: string }) => {
      counts.all++;
      if (a.status in counts) counts[a.status as keyof typeof counts]++;
    });
  }

  return (
    <div className="adm-page">
      <style>{`
        .aff-adm-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:28px; }
        .aff-adm-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:400; color:#1a1410; margin:0 0 4px; }
        .aff-adm-sub { font-size:13px; color:#8a7f76; margin:0; }
        .aff-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
        .aff-tab {
          padding:7px 16px; border-radius:999px; font-size:12px; letter-spacing:0.06em;
          text-transform:uppercase; border:1px solid #d4c9c0; background:#fff;
          color:#6b5e57; text-decoration:none; transition:all 0.15s;
        }
        .aff-tab:hover, .aff-tab.active { background:#1a1410; color:#fff; border-color:#1a1410; }
        .aff-search { display:flex; gap:10px; margin-bottom:24px; }
        .aff-search-input {
          flex:1; max-width:360px; border:1px solid #d4c9c0; border-radius:8px;
          padding:9px 14px; font-size:13px; font-family:'Jost',sans-serif;
          outline:none; transition:border-color 0.15s;
        }
        .aff-search-input:focus { border-color:#AC3438; }
        .aff-table-wrap { overflow-x:auto; }
        .aff-table {
          width:100%; border-collapse:collapse; font-size:13px;
        }
        .aff-table th {
          text-align:left; padding:10px 14px; font-size:11px; letter-spacing:0.1em;
          text-transform:uppercase; color:#8a7f76; border-bottom:1px solid #ede8e2;
          white-space:nowrap; background:#faf6f1;
        }
        .aff-table td {
          padding:13px 14px; border-bottom:1px solid #f0ece8; vertical-align:top;
          color:#1a1410;
        }
        .aff-table tr:hover td { background:#faf6f1; }
        .aff-status-badge {
          display:inline-block; padding:3px 10px; border-radius:999px;
          font-size:11px; letter-spacing:0.08em; text-transform:uppercase;
          font-weight:600;
        }
        .aff-platform { font-size:12px; color:#6b5e57; }
        .aff-about { max-width:320px; color:#6b5e57; font-size:12.5px; line-height:1.5;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .aff-date { color:#8a7f76; white-space:nowrap; font-size:12px; }
        .aff-empty { padding:64px 24px; text-align:center; color:#9c8f86; font-size:14px; }
        .aff-count-badge {
          display:inline-block; margin-left:5px; padding:1px 7px; border-radius:999px;
          background:rgba(172,52,56,0.12); color:#AC3438; font-size:10px; font-weight:700;
        }
      `}</style>

      <div className="aff-adm-header">
        <div>
          <h1 className="aff-adm-title">Affiliate Applications</h1>
          <p className="aff-adm-sub">{counts.all} total · {counts.pending} pending review</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="aff-tabs">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <a
            key={s}
            href={`/admin/affiliates${s === 'all' ? '' : `?status=${s}`}`}
            className={`aff-tab${(!searchParams.status && s === 'all') || searchParams.status === s ? ' active' : ''}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="aff-count-badge">{counts[s as keyof typeof counts]}</span>
          </a>
        ))}
      </div>

      {/* Search */}
      <form className="aff-search" method="GET" action="/admin/affiliates">
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <input
          className="aff-search-input"
          name="q"
          placeholder="Search by name or email…"
          defaultValue={searchParams.q}
        />
        <button type="submit" style={{ padding:'9px 20px', background:'#1a1410', color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>
          Search
        </button>
      </form>

      {error && (
        <p style={{ color: '#AC3438', marginBottom: 16 }}>
          Error loading applications: {error.message}
        </p>
      )}

      <div className="aff-table-wrap">
        {!apps || apps.length === 0 ? (
          <div className="aff-empty">No affiliate applications found.</div>
        ) : (
          <table className="aff-table">
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
              {apps.map((app: { id: string; name: string; email: string; platform: string | null; audience_size: string | null; website: string | null; about: string | null; status: string; created_at: string }) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.name}</td>
                  <td>
                    <a href={`mailto:${app.email}`} style={{ color: '#AC3438', textDecoration: 'none' }}>
                      {app.email}
                    </a>
                  </td>
                  <td className="aff-platform">{app.platform || '—'}</td>
                  <td className="aff-platform">{app.audience_size || '—'}</td>
                  <td>
                    {app.website ? (
                      <a href={app.website} target="_blank" rel="noopener noreferrer" style={{ color: '#AC3438', textDecoration: 'none', fontSize: 12 }}>
                        Visit ↗
                      </a>
                    ) : '—'}
                  </td>
                  <td><div className="aff-about" title={app.about ?? ''}>{app.about || '—'}</div></td>
                  <td>
                    <span
                      className="aff-status-badge"
                      style={{
                        background: `${STATUS_COLORS[app.status] || '#888'}20`,
                        color: STATUS_COLORS[app.status] || '#888',
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="aff-date">
                    {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <AffiliateActions id={app.id} currentStatus={app.status} email={app.email} name={app.name} />
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
