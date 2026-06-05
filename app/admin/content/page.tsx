import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { PAGE_SLUGS } from '@/lib/blocks';

export const dynamic = 'force-dynamic';

export default async function AdminContentIndex() {
  await requireAdmin();
  const sb = createServiceClient();
  const { data: blocks } = await sb
    .from('page_blocks')
    .select('page_slug, is_visible');
  const counts = new Map<string, { total: number; visible: number }>();
  for (const b of blocks ?? []) {
    const slug = b.page_slug as string;
    const stat = counts.get(slug) ?? { total: 0, visible: 0 };
    stat.total += 1;
    if (b.is_visible) stat.visible += 1;
    counts.set(slug, stat);
  }

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <h1 className="adm-h1">Page Content</h1>
        <p className="adm-page-sub">
          Pick a page to edit its blocks — headings, paragraphs, images, videos,
          calls-to-action and quotes. Changes go live on the public site within a minute.
        </p>
      </header>

      <div className="adm-page-grid">
        {PAGE_SLUGS.map((p) => {
          const stat = counts.get(p.slug) ?? { total: 0, visible: 0 };
          return (
            <Link key={p.slug} href={`/admin/content/${p.slug}`} className="adm-page-card">
              <div>
                <div className="adm-stat-label">{p.label}</div>
                <div className="adm-mono adm-page-sub" style={{ marginTop: 4 }}>{p.path}</div>
              </div>
              <div className="adm-page-card-stat">
                <strong>{stat.visible}</strong>
                <span>visible{stat.total !== stat.visible ? ` / ${stat.total} total` : ''}</span>
              </div>
              <span className="adm-page-card-arrow">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
