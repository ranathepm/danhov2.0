/**
 * Ring Builder commission checkout.
 *
 * Supports three purchase modes:
 *   ring    — setting + one or more diamonds (full commission, 50% deposit)
 *   setting — setting only (made-to-order, 50% deposit)
 *   diamond — one or more loose diamonds (50% deposit)
 *
 * Multi-diamond: pass `diamonds` array. Each item gets its own Stripe line
 * item so the receipt clearly shows per-stone pricing and quantities.
 * Legacy single-diamond: `diamond_offer_id` + `quantity` still work.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe, DEPOSIT_PERCENT } from '@/lib/stripe';
import { priceProduct } from '@/lib/pricing';
import { fetchProductWithPricingBySlug } from '@/lib/products';
import { refreshDiamond } from '@/lib/nivoda-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DiamondOrderItem = z.object({
  offer_id: z.string().min(8).max(80),
  quantity: z.number().int().min(1).max(10).default(1),
  hold_id: z.string().uuid().optional().nullable(),
});

const Body = z.object({
  mode: z.enum(['ring', 'setting', 'diamond']).default('ring'),
  setting_slug: z.string().min(1).max(120).optional(),
  setting_quantity: z.number().int().min(1).max(10).default(1),
  // Multi-diamond: preferred
  diamonds: z.array(DiamondOrderItem).optional(),
  // Legacy single-diamond
  diamond_offer_id: z.string().min(8).max(80).optional(),
  hold_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  email: z.string().email().max(254),
  ring_size: z.string().max(20).optional(),
  ring_sizes: z.array(z.string().max(20)).max(10).optional(),
  metal: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
});

function formatMetal(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/_/g, ' ');
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          'Online deposits are not yet enabled. Please reply to your email confirmation or call 1 (888) DANHOV-7 and we will take payment by phone.',
      },
      { status: 503 }
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { mode } = body;
  const settingQty = body.setting_quantity ?? 1;

  // Validate mode-specific required fields
  if ((mode === 'ring' || mode === 'setting') && !body.setting_slug) {
    return NextResponse.json({ error: 'setting_slug is required for this purchase type.' }, { status: 400 });
  }

  // Normalize diamonds: new array takes priority over legacy single field
  const normalizedDiamonds =
    body.diamonds && body.diamonds.length > 0
      ? body.diamonds
      : body.diamond_offer_id
      ? [{ offer_id: body.diamond_offer_id, quantity: body.quantity ?? 1, hold_id: body.hold_id ?? null }]
      : [];

  if (mode !== 'setting' && normalizedDiamonds.length === 0) {
    return NextResponse.json({ error: 'At least one diamond is required for this purchase type.' }, { status: 400 });
  }

  // ── Load setting ──────────────────────────────────────────────────────
  let setting: Awaited<ReturnType<typeof fetchProductWithPricingBySlug>> | null = null;
  let settingPrice = 0;
  let settingBreakdown = null;

  if (mode === 'ring' || mode === 'setting') {
    setting = await fetchProductWithPricingBySlug(body.setting_slug!);
    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }
    try {
      const breakdown = await priceProduct(setting, body.metal ?? setting.default_metal);
      settingPrice = breakdown.total_usd;
      settingBreakdown = breakdown;
    } catch (e) {
      console.error('ring-builder/checkout: pricing failed', e);
      const m = setting.price_display?.match(/[\d,]+/);
      settingPrice = m ? Number(m[0].replace(/,/g, '')) : 0;
    }
  }

  // ── Load all diamonds ─────────────────────────────────────────────────
  type LoadedDiamond = {
    offer_id: string;
    quantity: number;
    hold_id: string | null | undefined;
    shape: string;
    carat: number;
    color: string;
    clarity: string;
    cut: string;
    lab: string;
    certNumber: string | null;
    price: number;
  };

  const loadedDiamonds: LoadedDiamond[] = [];

  if (mode !== 'setting') {
    for (const item of normalizedDiamonds) {
      let stone;
      try {
        const r = await refreshDiamond(item.offer_id);
        stone = r.stone;
      } catch (e) {
        console.error('ring-builder/checkout: nivoda fetch failed', item.offer_id, e);
        return NextResponse.json(
          { error: 'We could not confirm a diamond is still available. Please re-select.' },
          { status: 503 }
        );
      }

      if (!stone) {
        return NextResponse.json(
          { error: `A diamond is no longer available. Please choose another stone.` },
          { status: 410 }
        );
      }

      const cert = stone.diamond.certificate;
      const diamondPrice = Math.round(Number(stone.markup_price ?? stone.price ?? 0));
      if (diamondPrice <= 0) {
        return NextResponse.json(
          { error: 'Diamond price unavailable. Please re-select or contact us at care@danhov.com.' },
          { status: 502 }
        );
      }

      loadedDiamonds.push({
        offer_id: item.offer_id,
        quantity: item.quantity,
        hold_id: item.hold_id,
        shape: (cert?.shape ?? 'Round').toString(),
        carat: cert?.carats ?? 1,
        color: cert?.color ?? '—',
        clarity: cert?.clarity ?? '—',
        cut: cert?.cut ?? '—',
        lab: cert?.lab ?? 'GIA',
        certNumber: cert?.certNumber ?? null,
        price: diamondPrice,
      });
    }
  }

  // ── Totals ────────────────────────────────────────────────────────────
  const settingLineTotal = mode !== 'diamond' ? settingPrice * settingQty : 0;
  const diamondLineTotal = loadedDiamonds.reduce((sum, d) => sum + d.price * d.quantity, 0);
  const total = settingLineTotal + diamondLineTotal;
  const deposit = Math.round(total * DEPOSIT_PERCENT);
  const balance = total - deposit;
  const customerEmail = body.email.toLowerCase();
  const ringSize = body.ring_size ?? body.ring_sizes?.[0] ?? null;
  const customerNote = body.note?.trim() || null;

  // ── Build Stripe line items ───────────────────────────────────────────
  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string; images?: string[]; metadata?: Record<string, string> };
    };
  }> = [];
  const heroImage = setting?.images?.[0];

  if (mode !== 'diamond' && setting) {
    const settingDepositPerUnit = Math.round(settingPrice * DEPOSIT_PERCENT);
    const metalLabel = formatMetal(body.metal ?? setting.default_metal);
    lineItems.push({
      quantity: settingQty,
      price_data: {
        currency: 'usd',
        unit_amount: settingDepositPerUnit * 100,
        product_data: {
          name: `${setting.name}${metalLabel ? ` (${metalLabel})` : ''}`,
          description: [
            `SKU: ${setting.sku}`,
            ringSize ? `Ring size: ${ringSize}` : '',
            `Unit price: $${settingPrice.toLocaleString('en-US')}`,
          ].filter(Boolean).join(' · '),
          images: heroImage ? [heroImage] : undefined,
          metadata: { sku: setting.sku, type: 'setting' },
        },
      },
    });
  }

  for (const [i, d] of loadedDiamonds.entries()) {
    const diamondDepositPerUnit = Math.round(d.price * DEPOSIT_PERCENT);
    const label = loadedDiamonds.length > 1 ? ` (stone ${i + 1})` : '';
    lineItems.push({
      quantity: d.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: diamondDepositPerUnit * 100,
        product_data: {
          name: `${d.carat.toFixed(2)} ct ${d.shape} Diamond${label}`,
          description: [
            `${d.lab}${d.certNumber ? ` ${d.certNumber}` : ''}`,
            `${d.color} / ${d.clarity} / ${d.cut}`,
            `Unit price: $${d.price.toLocaleString('en-US')}`,
          ].join(' · '),
          metadata: {
            nivoda_offer_id: d.offer_id,
            type: 'diamond',
          },
        },
      },
    });
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://danhov-web.vercel.app';

  const cancelParams = new URLSearchParams();
  if (body.setting_slug) cancelParams.set('setting', body.setting_slug);
  if (loadedDiamonds.length > 1) {
    cancelParams.set('diamonds', loadedDiamonds.map(d => d.offer_id).join('|'));
  } else if (loadedDiamonds.length === 1) {
    cancelParams.set('diamond', loadedDiamonds[0].offer_id);
    if (loadedDiamonds[0].hold_id) cancelParams.set('hold', loadedDiamonds[0].hold_id);
  }

  const firstDiamond = loadedDiamonds[0] ?? null;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/ring-builder/review?${cancelParams.toString()}`,
    line_items: lineItems,
    metadata: {
      flow: 'ring_builder',
      purchase_mode: mode,
      ring_size: ringSize ?? '',
      setting_slug: setting?.slug ?? '',
      setting_sku: setting?.sku ?? '',
      setting_metal: body.metal ?? setting?.default_metal ?? '',
      setting_quantity: String(settingQty),
      diamond_count: String(loadedDiamonds.length),
      // First diamond for legacy compatibility
      nivoda_offer_id: firstDiamond?.offer_id ?? '',
      nivoda_hold_id: firstDiamond?.hold_id ?? '',
      diamond_shape: firstDiamond?.shape ?? '',
      diamond_carat: firstDiamond ? String(firstDiamond.carat) : '',
      diamond_color: firstDiamond?.color ?? '',
      diamond_clarity: firstDiamond?.clarity ?? '',
      diamond_cut: firstDiamond?.cut ?? '',
      total_usd: String(total),
      deposit_usd: String(deposit),
      setting_price_usd: String(settingPrice),
      customer_note: customerNote ?? '',
    },
    payment_intent_data: {
      metadata: {
        flow: 'ring_builder',
        purchase_mode: mode,
        setting_sku: setting?.sku ?? '',
        nivoda_offer_id: firstDiamond?.offer_id ?? '',
      },
    },
  });

  // ── Persist pending order ─────────────────────────────────────────────
  const client = createServiceClient();
  await client
    .from('customers')
    .upsert({ email: customerEmail }, { onConflict: 'email' });

  // diamonds[] array with quantities for the bundle
  const bundleDiamonds = loadedDiamonds.map(d => ({
    offer_id: d.offer_id,
    hold_id: d.hold_id ?? null,
    shape: d.shape,
    carat: d.carat,
    color: d.color,
    clarity: d.clarity,
    cut: d.cut,
    lab: d.lab,
    cert_number: d.certNumber,
    price_usd: d.price,
    quantity: d.quantity,
  }));

  await client.from('orders').insert({
    customer_email: customerEmail,
    stripe_checkout_session_id: session.id,
    deposit_usd: deposit,
    total_usd: total,
    status: 'pending',
    currency: 'usd',
    nivoda_offer_id: firstDiamond?.offer_id ?? null,
    nivoda_hold_id: firstDiamond?.hold_id ?? null,
    product_sku: setting?.sku ?? null,
    product_name: setting?.name ?? null,
    custom_overrides: {
      ring_size: ringSize ?? null,
      ring_sizes: body.ring_sizes ?? null,
      note: customerNote,
    },
    milestones: [
      {
        name: 'deposit',
        amount_usd: deposit,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      { name: 'balance', amount_usd: balance, status: 'not_due' },
    ],
    shipping_address: {
      _bundle: {
        flow: 'ring_builder',
        mode,
        ring_size: ringSize ?? null,
        setting: setting
          ? {
              sku: setting.sku,
              slug: setting.slug,
              name: setting.name,
              metal: body.metal ?? setting.default_metal,
              price_usd: settingPrice,
              quantity: settingQty,
              breakdown: settingBreakdown,
            }
          : null,
        // New: full diamonds array with individual quantities
        diamonds: bundleDiamonds,
        // Legacy: keep single diamond object for backward compat with old admin views
        diamond: bundleDiamonds[0] ?? null,
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
