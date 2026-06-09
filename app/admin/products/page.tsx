import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { stripMetalSuffix } from '@/lib/product-display';

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

      {/* Category filter pills */}
      <div className="adm-filter-pills">
        {[
          { key: '',           label: 'All'            },
          { key: 'engagement', label: 'Engagement'     },
          { key: 'wedding',    label: 'Wedding bands'  },
          { key: 'fine',       label: 'Fine jewelry'   },
          { key: 'mens',       label: "Men's"          },
        ].map(({ key, label }) => {
          const p = new URLSearchParams();
          if (key) p.set('category', key);
          if (searchParams.q) p.set('q', searchParams.q);
          if (searchParams.only) p.set('only', searchParams.only);
          const href = `/admin/products${p.toString() ? `?${p.toString()}` : ''}`;
          const active = (!searchParams.category && key === '') || searchParams.category === key;
          return (
            <a key={key} href={href} className={`adm-filter-pill${active ? ' is-active' : ''}`}>
              {label}
            </a>
          );
        })}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {[
            { key: '',         label: 'Active & inactive' },
            { key: 'inactive', label: 'Inactive only'     },
          ].map(({ key, label }) => {
            const p = new URLSearchParams();
            if (searchParams.category) p.set('category', searchParams.category);
            if (searchParams.q) p.set('q', searchParams.q);
            if (key) p.set('only', key);
            const href = `/admin/products${p.toString() ? `?${p.toString()}` : ''}`;
            const active = (!searchParams.only && key === '') || searchParams.only === key;
            return (
              <a key={key} href={href} className={`adm-filter-pill${active ? ' is-active' : ''}`}>
                {label}
              </a>
            );
          })}
        </span>
      </div>

      {/* Search toolbar */}
      <form className="adm-toolbar" method="get" action="/admin/products">
        {searchParams.category && (
          <input type="hidden" name="category" value={searchParams.category} />
        )}
        {searchParams.only && (
          <input type="hidden" name="only" value={searchParams.only} />
        )}
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search SKU, name, collection…"
          className="adm-input adm-toolbar-search"
        />
        <button type="submit" className="adm-btn adm-btn-primary">Search</button>
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
                  <td className="adm-cell-name">{stripMetalSuffix(p.name)}</td>
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
