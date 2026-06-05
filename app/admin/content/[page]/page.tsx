import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { PAGE_SLUGS, type Block } from '@/lib/blocks';
import PageBlockEditor from '@/components/admin/PageBlockEditor';

export const dynamic = 'force-dynamic';

export default async function AdminContentPageEditor({
  params,
}: {
  params: { page: string };
}) {
  await requireAdmin();
  const meta = PAGE_SLUGS.find((p) => p.slug === params.page);
  if (!meta) notFound();

  const sb = createServiceClient();
  const { data } = await sb
    .from('page_blocks')
    .select('id, page_slug, position, type, data, is_visible')
    .eq('page_slug', meta.slug)
    .order('position', { ascending: true });

  const blocks: Block[] = (data as Block[]) ?? [];

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <Link href="/admin/content" className="adm-back-link">← All pages</Link>
          <h1 className="adm-h1">{meta.label}</h1>
          <p className="adm-page-sub">
            <span className="adm-mono">{meta.path}</span> · {blocks.length} block{blocks.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link href={meta.path} target="_blank" className="adm-btn">View live ↗</Link>
      </header>

      <PageBlockEditor pageSlug={meta.slug} initial={blocks} />
    </div>
  );
}
