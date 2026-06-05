import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchLaborCategories } from '@/lib/labor-server';
import OrderDetail from '@/components/admin/OrderDetail';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const sb = createServiceClient();

  const { data: order } = await sb
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!order) notFound();

  // Pull the linked product (if any) so we can show name + image + the
  // original spec the customer locked.
  let product: {
    sku: string;
    name: string;
    slug: string;
    collection: string | null;
    platinum_weight_g: number | null;
    gold_weight_g: number | null;
    stone_count: number | null;
    stone_size_mm: number | null;
    images: string[] | null;
    stone_groups: { count: number | null; size_mm: number | null; length_mm?: number | null; width_mm?: number | null; shape: string | null }[] | null;
    default_metal: string | null;
    metals: string[] | null;
  } | null = null;

  let quoteLock: {
    metal_choice: string | null;
    locked_price_usd: number | null;
    breakdown: unknown;
  } | null = null;

  if (order.quote_lock_id) {
    const { data: lock } = await sb
      .from('quote_locks')
      .select('product_id, metal_choice, locked_price_usd, breakdown')
      .eq('id', order.quote_lock_id)
      .maybeSingle();
    if (lock) {
      quoteLock = {
        metal_choice: (lock.metal_choice as string | null) ?? null,
        locked_price_usd: lock.locked_price_usd as number | null,
        breakdown: lock.breakdown,
      };
      if (lock.product_id) {
        const { data: p } = await sb
          .from('products')
          .select('sku, name, slug, collection, platinum_weight_g, gold_weight_g, stone_count, stone_size_mm, images, stone_groups, default_metal, metals')
          .eq('id', lock.product_id)
          .maybeSingle();
        if (p) {
          product = {
            sku: p.sku as string,
            name: p.name as string,
            slug: p.slug as string,
            collection: (p.collection as string | null) ?? null,
            platinum_weight_g: p.platinum_weight_g as number | null,
            gold_weight_g: p.gold_weight_g as number | null,
            stone_count: p.stone_count as number | null,
            stone_size_mm: p.stone_size_mm as number | null,
            images: (p.images as string[] | null) ?? [],
            stone_groups: (p.stone_groups as { count: number | null; size_mm: number | null; length_mm?: number | null; width_mm?: number | null; shape: string | null }[] | null) ?? null,
            default_metal: (p.default_metal as string | null) ?? null,
            metals: (p.metals as string[] | null) ?? null,
          };
        }
      }
    }
  }

  // Fallback: try by stored sku
  if (!product && order.product_sku) {
    const { data: p } = await sb
      .from('products')
      .select('sku, name, slug, collection, platinum_weight_g, gold_weight_g, stone_count, stone_size_mm, images, stone_groups, default_metal, metals')
      .eq('sku', order.product_sku)
      .maybeSingle();
    if (p) {
      product = {
        sku: p.sku as string,
        name: p.name as string,
        slug: p.slug as string,
        collection: (p.collection as string | null) ?? null,
        platinum_weight_g: p.platinum_weight_g as number | null,
        gold_weight_g: p.gold_weight_g as number | null,
        stone_count: p.stone_count as number | null,
        stone_size_mm: p.stone_size_mm as number | null,
        images: (p.images as string[] | null) ?? [],
        stone_groups: (p.stone_groups as { count: number | null; size_mm: number | null; length_mm?: number | null; width_mm?: number | null; shape: string | null }[] | null) ?? null,
        default_metal: (p.default_metal as string | null) ?? null,
        metals: (p.metals as string[] | null) ?? null,
      };
    }
  }

  const laborCategories = await fetchLaborCategories();

  return (
    <div className="adm-page">
      <header className="adm-page-head">
        <div>
          <Link href="/admin/orders" className="adm-back-link">← All orders</Link>
          <h1 className="adm-h1">
            Order <span className="adm-mono">{String(order.id).slice(0, 8).toUpperCase()}</span>
          </h1>
          <p className="adm-page-sub">
            Placed {new Date(order.created_at).toLocaleString('en-US', {
              dateStyle: 'full', timeStyle: 'short',
            })}
          </p>
        </div>
        <div className="adm-page-head-actions">
          <a
            href={`/admin/orders/${order.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="adm-btn adm-btn-primary"
          >
            Print Invoice
          </a>
        </div>
      </header>

      <OrderDetail
        order={order}
        product={product}
        quoteLock={quoteLock}
        laborCategories={laborCategories}
      />
    </div>
  );
}
