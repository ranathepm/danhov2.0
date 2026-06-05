import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import NewProductFlow from '@/components/admin/NewProductFlow';

export const dynamic = 'force-dynamic';

export default async function AdminNewProductPage() {
  await requireAdmin();
  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <Link href="/admin/products" className="adm-back-link">← All products</Link>
          <h1 className="adm-h1">New product</h1>
          <p className="adm-page-sub">A new piece for the catalog</p>
        </div>
      </header>
      <NewProductFlow />
    </div>
  );
}
