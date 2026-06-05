import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Search = { q?: string; category?: string; only?: string };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  await requireAdmin();
  const sb = createServiceClient();
  let query = sb
    .from('products')
    .select(
      'sku, slug, name, collection, category, categories, metals, images, price_display, is_active'
    )
    .order('category')
    .order('collection')
    .order('sku');
  if (searchParams.category) query = query.eq('category', searchParams.category);
  if (searchParams.only === 'inactive') query = query.eq('is_active', false);
  if (searchParams.q) {
    const q = searchParams.q.trim();
    query = query.or(`sku.ilike.%${q}%,name.ilike.%${q}%,collection.ilike.%${q}%`);
  }

  type ProductRow = {
    sku: string;
    slug: string;
    name: string;
    collection: string | null;
    category: string;
    categories: string[] | null;
    metals: string[] | null;
    images: string[] | null;
    price_display: string | null;
    is_active: boolean;
  };
  const { data: products } = await query.limit(500);
  const list: ProductRow[] = (products as ProductRow[]) ?? [];

  return (
    <div className="adm-page">
      <header className="adm-page-head adm-page-head--with-actions">
        <div>
          <h1 className="adm-h1">Products</h1>
          <p className="adm-page-sub">{list.length} pieces shown</p>
        </div>
        <Link href="/admin/products/new" className="adm-btn adm-btn-primary">
          + New product
        </Link>
      </header>

      <form className="adm-toolbar" method="get" action="/admin/products">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search SKU, name, collection…"
          className="adm-input adm-toolbar-search"
        />
        <select
          name="category"
          defaultValue={searchParams.category ?? ''}
          className="adm-select"
        >
          <option value="">All categories</option>
          <option value="engagement">Engagement rings</option>
          <option value="wedding">Wedding bands</option>
          <option value="fine">Fine jewelry</option>
          <option value="mens">Men&apos;s</option>
        </select>
        <select
          name="only"
          defaultValue={searchParams.only ?? ''}
          className="adm-select"
        >
          <option value="">Active &amp; inactive</option>
          <option value="inactive">Inactive only</option>
        </select>
        <button type="submit" className="adm-btn">Filter</button>
        {(searchParams.q || searchParams.category || searchParams.only) && (
          <Link href="/admin/products" className="adm-link">Reset</Link>
        )}
      </form>

      <div className="adm-card adm-card--flush">
        <table className="adm-table adm-table--products">
          <thead>
            <tr>
              <th></th>
              <th>SKU</th>
              <th>Name</th>
              <th>Collection</th>
              <th>Category</th>
              <th>Images</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const hero = (p.images as string[])?.[0] ?? null;
              return (
                <tr key={p.sku}>
                  <td className="adm-cell-thumb">
                    {hero ? (
                      <Image src={hero} alt={p.name} width={56} height={56} />
                    ) : (
                      <span className="adm-thumb-empty">—</span>
                    )}
                  </td>
                  <td className="adm-mono">{p.sku}</td>
                  <td className="adm-cell-name">{p.name}</td>
                  <td>{p.collection || '—'}</td>
                  <td className="adm-cap">{p.category}</td>
                  <td>{(p.images as string[])?.length ?? 0}</td>
                  <td>{p.price_display || '—'}</td>
                  <td>
                    <span className={`adm-pill adm-pill--${p.is_active ? 'active' : 'inactive'}`}>
                      {p.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="adm-cell-actions">
                    <Link
                      href={`/admin/products/${encodeURIComponent(p.sku)}`}
                      className="adm-link"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <div className="adm-empty">No products match.</div>}
      </div>
    </div>
  );
}
