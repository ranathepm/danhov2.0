import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { platinumToGoldWeightG } from '@/lib/labor';
import { caratFromMm } from '@/lib/stone-math';
import PrintInvoice from '@/components/admin/PrintInvoice';

export const dynamic = 'force-dynamic';

export default async function PrintInvoicePage({
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

  let productName = order.product_name as string | null;
  let productSku = order.product_sku as string | null;
  let productCollection: string | null = null;
  let productStoneCount: number | null = null;
  let productStoneMm: number | null = null;
  let productWeight: number | null = null;

  if (productSku) {
    const { data: p } = await sb
      .from('products')
      .select('sku, name, collection, stone_count_input, stone_size_mm, gold_weight_g')
      .eq('sku', productSku)
      .maybeSingle();
    if (p) {
      productName = (p.name as string) ?? productName;
      productCollection = (p.collection as string | null) ?? null;
      productStoneCount = (p.stone_count_input as number | null) ?? null;
      productStoneMm = (p.stone_size_mm as number | null) ?? null;
      productWeight = (p.gold_weight_g as number | null) ?? null;
    }
  } else if (order.quote_lock_id) {
    const { data: lock } = await sb
      .from('quote_locks')
      .select('product_id')
      .eq('id', order.quote_lock_id)
      .maybeSingle();
    if (lock?.product_id) {
      const { data: p } = await sb
        .from('products')
        .select('sku, name, collection, stone_count_input, stone_size_mm, gold_weight_g')
        .eq('id', lock.product_id)
        .maybeSingle();
      if (p) {
        productName = p.name as string;
        productSku = p.sku as string;
        productCollection = (p.collection as string | null) ?? null;
        productStoneCount = (p.stone_count_input as number | null) ?? null;
        productStoneMm = (p.stone_size_mm as number | null) ?? null;
        productWeight = (p.gold_weight_g as number | null) ?? null;
      }
    }
  }

  const co = (order.custom_overrides ?? {}) as {
    platinum_weight_g?: number | null;
    stone_count?: number | null;
    stone_size_mm?: number | null;
    metal_override?: string | null;
    engraving?: string | null;
    ring_size?: string | null;
    stone_color?: string | null;
    stone_clarity?: string | null;
  };

  // Source spec values: override → product → null
  const platinumWeight = co.platinum_weight_g ?? productWeight ?? null;
  const stoneCount = co.stone_count ?? productStoneCount ?? null;
  const stoneSizeMm = co.stone_size_mm ?? productStoneMm ?? null;
  const totalCarats =
    stoneCount != null && stoneSizeMm != null && stoneSizeMm > 0 && stoneCount > 0
      ? caratFromMm(stoneSizeMm) * stoneCount
      : null;

  // Centre diamond pulled from the bundle metadata if this was a
  // ring-builder flow checkout.
  const bundle = (order.shipping_address as { _bundle?: { diamond?: unknown } } | null | undefined)?._bundle;
  type BundleDiamond = {
    carat?: number;
    shape?: string;
    color?: string;
    clarity?: string;
    lab?: string | null;
    cert_number?: string | null;
  };
  const diamond = (bundle?.diamond ?? null) as BundleDiamond | null;
  const centerDiamond = diamond
    ? {
        carat: diamond.carat ?? null,
        shape: diamond.shape ?? null,
        color: diamond.color ?? null,
        clarity: diamond.clarity ?? null,
        lab: diamond.lab ?? null,
        cert_number: diamond.cert_number ?? null,
      }
    : null;

  return (
    <PrintInvoice
      order={{
        id: order.id as string,
        created_at: order.created_at as string,
        customer_email: order.customer_email as string,
        total_usd: Number(order.total_usd ?? 0),
        deposit_usd: Number(order.deposit_usd ?? 0),
        shipping_cost_usd: order.shipping_cost_usd != null
          ? Number(order.shipping_cost_usd)
          : null,
        status: order.status as string,
        currency: (order.currency as string | null) ?? 'usd',
        shipping_address: order.shipping_address,
        tracking_number: (order.tracking_number as string | null) ?? null,
        tracking_carrier: (order.tracking_carrier as string | null) ?? null,
      }}
      product={{
        name: productName ?? 'Custom DANHOV Piece',
        sku: productSku ?? '—',
        collection: productCollection ?? null,
      }}
      spec={{
        platinum_weight_g: platinumWeight,
        gold_equiv_weight_g: platinumWeight
          ? platinumToGoldWeightG(platinumWeight)
          : null,
        stone_count: stoneCount,
        stone_size_mm: stoneSizeMm,
        total_carats: totalCarats,
        stone_color: co.stone_color ?? null,
        stone_clarity: co.stone_clarity ?? null,
        metal: co.metal_override ?? null,
        ring_size: co.ring_size ?? null,
        engraving: co.engraving ?? null,
      }}
      centerDiamond={centerDiamond}
    />
  );
}
