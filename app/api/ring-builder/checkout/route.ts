/**
 * Ring Builder commission checkout.
 *
 * Supports three purchase modes:
 *   ring    — setting + diamond (full commission, 50% deposit)
 *   setting — setting only (made-to-order, 50% deposit)
 *   diamond — loose diamond only (50% deposit)
 *
 * Flow:
 *   1. Validate body; derive mode from fields present
 *   2. Load setting (ring / setting modes) and/or diamond (ring / diamond modes)
 *   3. Compute total → 50% deposit
 *   4. Create Stripe Checkout session
 *   5. Insert pending order row (ring_size in custom_overrides, full bundle in shipping_address._bundle)
 *   6. Return Checkout URL
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

const Body = z.object({
  mode: z.enum(['ring', 'setting', 'diamond']).default('ring'),
  setting_slug: z.string().min(1).max(120).optional(),
  diamond_offer_id: z.string().min(8).max(80).optional(),
  hold_id: z.string().uuid().optional(),
  email: z.string().email().max(254),
  ring_size: z.string().max(20).optional(),
  metal: z.string().max(60).optional(),
});

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

  // Validate mode-specific required fields
  if ((mode === 'ring' || mode === 'setting') && !body.setting_slug) {
    return NextResponse.json({ error: 'setting_slug is required for this purchase type.' }, { status: 400 });
  }
  if ((mode === 'ring' || mode === 'diamond') && !body.diamond_offer_id) {
    return NextResponse.json({ error: 'diamond_offer_id is required for this purchase type.' }, { status: 400 });
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

  // ── Load diamond ──────────────────────────────────────────────────────
  let diamondData: {
    shape: string; carat: number; color: string; clarity: string; cut: string;
    lab: string; certNumber: string | null; price: number;
  } | null = null;

  if (mode === 'ring' || mode === 'diamond') {
    let stone;
    try {
      const r = await refreshDiamond(body.diamond_offer_id!);
      stone = r.stone;
    } catch (e) {
      console.error('ring-builder/checkout: nivoda fetch failed', e);
      return NextResponse.json(
        { error: 'We could not confirm the diamond is still available. Please re-select.' },
        { status: 503 }
      );
    }

    if (!stone) {
      return NextResponse.json(
        { error: 'This diamond is no longer available. Please choose another stone.' },
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

    diamondData = {
      shape: (cert?.shape ?? 'Round').toString(),
      carat: cert?.carats ?? 1,
      color: cert?.color ?? '—',
      clarity: cert?.clarity ?? '—',
      cut: cert?.cut ?? '—',
      lab: cert?.lab ?? 'GIA',
      certNumber: cert?.certNumber ?? null,
      price: diamondPrice,
    };
  }

  // ── Totals ────────────────────────────────────────────────────────────
  const total =
    mode === 'ring'
      ? settingPrice + (diamondData?.price ?? 0)
      : mode === 'setting'
      ? settingPrice
      : (diamondData?.price ?? 0);

  const deposit = Math.round(total * DEPOSIT_PERCENT);
  const balance = total - deposit;
  const customerEmail = body.email.toLowerCase();
  const ringSize = body.ring_size ?? null;

  // ── Stripe line item label ────────────────────────────────────────────
  let itemName: string;
  let itemDesc: string;
  if (mode === 'ring' && setting && diamondData) {
    itemName = `${setting.name} + ${diamondData.carat.toFixed(2)}ct ${diamondData.shape} diamond — 50% commission deposit`;
    itemDesc = [
      `Setting (${setting.sku}, ${(body.metal ?? setting.default_metal ?? '14k_yellow').replace(/_/g, ' ')}): $${settingPrice.toLocaleString('en-US')}`,
      `Diamond (${diamondData.lab}${diamondData.certNumber ? ` ${diamondData.certNumber}` : ''}, ${diamondData.color}/${diamondData.clarity}/${diamondData.cut}): $${diamondData.price.toLocaleString('en-US')}`,
      ringSize ? `Ring size: ${ringSize}` : '',
      `Total: $${total.toLocaleString('en-US')} · Balance of $${balance.toLocaleString('en-US')} due before shipping.`,
    ].filter(Boolean).join('\n');
  } else if (mode === 'setting' && setting) {
    itemName = `${setting.name} — setting commission, 50% deposit`;
    itemDesc = [
      `Setting (${setting.sku}, ${(body.metal ?? setting.default_metal ?? '14k_yellow').replace(/_/g, ' ')}): $${settingPrice.toLocaleString('en-US')}`,
      ringSize ? `Ring size: ${ringSize}` : '',
      `Total: $${total.toLocaleString('en-US')} · Balance of $${balance.toLocaleString('en-US')} due before shipping.`,
    ].filter(Boolean).join('\n');
  } else {
    itemName = `${(diamondData?.carat ?? 0).toFixed(2)}ct ${diamondData?.shape ?? ''} Diamond — 50% deposit`;
    itemDesc = [
      `${diamondData?.lab ?? 'GIA'}${diamondData?.certNumber ? ` ${diamondData.certNumber}` : ''}, ${diamondData?.color}/${diamondData?.clarity}/${diamondData?.cut}`,
      `Total: $${total.toLocaleString('en-US')} · Balance of $${balance.toLocaleString('en-US')} due before shipping.`,
    ].join('\n');
  }

  const stripe = getStripe();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://danhov-web.vercel.app';
  const heroImage = setting?.images?.[0];

  const cancelParams = new URLSearchParams();
  if (body.setting_slug) cancelParams.set('setting', body.setting_slug);
  if (body.diamond_offer_id) cancelParams.set('diamond', body.diamond_offer_id);
  if (body.hold_id) cancelParams.set('hold', body.hold_id);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/ring-builder/review?${cancelParams.toString()}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: deposit * 100,
          product_data: {
            name: itemName,
            description: itemDesc,
            images: heroImage ? [heroImage] : undefined,
            metadata: {
              sku: setting?.sku ?? '',
              nivoda_offer_id: body.diamond_offer_id ?? '',
            },
          },
        },
      },
    ],
    metadata: {
      flow: 'ring_builder',
      purchase_mode: mode,
      ring_size: ringSize ?? '',
      setting_slug: setting?.slug ?? '',
      setting_sku: setting?.sku ?? '',
      setting_metal: body.metal ?? setting?.default_metal ?? '',
      nivoda_offer_id: body.diamond_offer_id ?? '',
      nivoda_hold_id: body.hold_id ?? '',
      diamond_shape: diamondData?.shape ?? '',
      diamond_carat: diamondData ? String(diamondData.carat) : '',
      diamond_color: diamondData?.color ?? '',
      diamond_clarity: diamondData?.clarity ?? '',
      diamond_cut: diamondData?.cut ?? '',
      total_usd: String(total),
      deposit_usd: String(deposit),
      setting_price_usd: String(settingPrice),
      diamond_price_usd: diamondData ? String(diamondData.price) : '',
    },
    payment_intent_data: {
      metadata: {
        flow: 'ring_builder',
        purchase_mode: mode,
        setting_sku: setting?.sku ?? '',
        nivoda_offer_id: body.diamond_offer_id ?? '',
      },
    },
  });

  // ── Persist pending order ─────────────────────────────────────────────
  const client = createServiceClient();
  await client
    .from('customers')
    .upsert({ email: customerEmail }, { onConflict: 'email' });

  await client.from('orders').insert({
    customer_email: customerEmail,
    stripe_checkout_session_id: session.id,
    deposit_usd: deposit,
    total_usd: total,
    status: 'pending',
    currency: 'usd',
    nivoda_offer_id: body.diamond_offer_id ?? null,
    nivoda_hold_id: body.hold_id ?? null,
    product_sku: setting?.sku ?? null,
    product_name: setting?.name ?? null,
    custom_overrides: {
      ring_size: ringSize ?? null,
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
              breakdown: settingBreakdown,
            }
          : null,
        diamond: diamondData
          ? {
              offer_id: body.diamond_offer_id,
              hold_id: body.hold_id ?? null,
              shape: diamondData.shape,
              carat: diamondData.carat,
              color: diamondData.color,
              clarity: diamondData.clarity,
              cut: diamondData.cut,
              lab: diamondData.lab,
              cert_number: diamondData.certNumber,
              price_usd: diamondData.price,
            }
          : null,
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
