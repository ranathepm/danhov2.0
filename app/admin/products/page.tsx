import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { stripMetalSuffix } from '@/lib/product-display';
import { computeListingPriceMap } from '@/lib/pricing';

/** Strip metal suffix and re-attach -PL to show the platinum-default SKU. */
function toPlSku(sku: string): string {
  const base = sku.replace(/-?(PL|PLAT|14Y|14W|14R|18Y|18W|18R)$/i, '');
  return base === sku ? sku : `${base}-PL`;
}

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
      'sku, slug, name, collection, category, categories, metals, default_metal, images, price_display, is_active, gold_weight_g, markup_multiplier, base_labor_usd, diamond_labor_usd, casting_labor_per_gram, stones_value_usd, stone_groups'
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
    default_metal: string | null;
    images: string[] | null;
    price_display: string | null;
    is_active: boolean;
    gold_weight_g: number | null;
    markup_multiplier: number | null;
    base_labor_usd: number | null;
    diamond_labor_usd: number | null;
    casting_labor_per_gram: number | null;
    stones_value_usd: number | null;
    stone_groups: unknown;
  };
  const { data: products } = await query.limit(500);
  const list: ProductRow[] = (products as ProductRow[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceMap = await computeListingPriceMap(list as any[]);

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
                      <Image src={hero} alt={p.name} width={80} height={80} />
                    ) : (
                      <span className="adm-thumb-empty">—</span>
                    )}
                  </td>
                  <td className="adm-mono">{toPlSku(p.sku)}</td>
                  <td className="adm-cell-name">{stripMetalSuffix(p.name)}</td>
                  <td>{p.collection || '—'}</td>
                  <td className="adm-cap">{p.category}</td>
                  <td>{(p.images as string[])?.length ?? 0}</td>
                  <td>
                    {priceMap[p.sku] != null
                      ? <><strong>${priceMap[p.sku].toLocaleString('en-US')}</strong>{p.price_display && p.price_display !== '$' + priceMap[p.sku].toLocaleString('en-US') ? <span style={{color:'#9c8f86',fontSize:11,marginLeft:4}}>({p.price_display})</span> : null}</>
                      : (p.price_display || '—')}
                  </td>
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
