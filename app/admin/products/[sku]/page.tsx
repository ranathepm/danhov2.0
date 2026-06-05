import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import ProductEditor from '@/components/admin/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function AdminProductDetailPage({
  params,
}: {
  params: { sku: string };
}) {
  await requireAdmin();
  const sb = createServiceClient();
  const sku = decodeURIComponent(params.sku);
  const { data } = await sb.from('products').select('*').eq('sku', sku).maybeSingle();
  if (!data) notFound();

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <Link href="/admin/products" className="adm-back-link">← All products</Link>
          <h1 className="adm-h1">{data.name}</h1>
          <p className="adm-page-sub">Style {data.sku}</p>
        </div>
      </header>
      <ProductEditor product={data} />
    </div>
  );
}
