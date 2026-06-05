/**
 * Ring Builder commission checkout.
 *
 * Flow:
 *   1. Client posts { setting_slug, diamond_offer_id, hold_id?, email }
 *   2. Re-fetch the diamond from Nivoda (with cache bypass) to confirm
 *      current price + availability. If the stone has been sold since the
 *      customer picked it, we 410 and ask them to re-pick.
 *   3. Compute live setting price + diamond price → total
 *   4. Create Stripe Checkout for 50% deposit
 *   5. Store a pending order row with nivoda_offer_id + nivoda_hold_id
 *      so the webhook can place the Nivoda order on payment success.
 *   6. Return the Checkout URL → client redirects
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
  setting_slug: z.string().min(1).max(120),
  diamond_offer_id: z.string().min(8).max(80),
  hold_id: z.string().uuid().optional(),
  email: z.string().email().max(254),
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

  const setting = await fetchProductWithPricingBySlug(body.setting_slug);
  if (!setting) {
    return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
  }

  // Fresh-fetch the diamond — never trust a stale price on the way into checkout
  let stone;
  try {
    const r = await refreshDiamond(body.diamond_offer_id);
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
  const carat = cert?.carats ?? 1;
  const shape = (cert?.shape ?? 'Round').toString();
  const color = cert?.color ?? '—';
  const clarity = cert?.clarity ?? '—';
  const cut = cert?.cut ?? '—';
  const lab = cert?.lab ?? 'GIA';
  const certNumber = cert?.certNumber ?? null;
  const diamondPrice = Math.round(Number(stone.markup_price ?? stone.price ?? 0));

  if (diamondPrice <= 0) {
    return NextResponse.json(
      { error: 'Diamond price unavailable. Please re-select or contact us at care@danhov.com.' },
      { status: 502 }
    );
  }

  // Live setting price
  let settingPrice = 0;
  let settingBreakdown = null;
  try {
    const breakdown = await priceProduct(setting, setting.default_metal);
    settingPrice = breakdown.total_usd;
    settingBreakdown = breakdown;
  } catch (e) {
    console.error('ring-builder/checkout: pricing failed', e);
    const m = setting.price_display?.match(/[\d,]+/);
    settingPrice = m ? Number(m[0].replace(/,/g, '')) : 0;
  }

  const total = settingPrice + diamondPrice;
  const deposit = Math.round(total * DEPOSIT_PERCENT);
  const balance = total - deposit;

  const customerEmail = body.email.toLowerCase();
  const stripe = getStripe();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://danhov-web.vercel.app';

  const heroImage = setting.images?.[0];
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/ring-builder/review?setting=${encodeURIComponent(body.setting_slug)}&diamond=${encodeURIComponent(body.diamond_offer_id)}${body.hold_id ? `&hold=${body.hold_id}` : ''}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: deposit * 100,
          product_data: {
            name: `${setting.name} + ${carat.toFixed(2)}ct ${shape} diamond — 50% commission deposit`,
            description: `Setting (${setting.sku}, ${(setting.default_metal || '14k_yellow').replace(/_/g, ' ')}): $${settingPrice.toLocaleString('en-US')}\nDiamond (${lab}${certNumber ? ` ${certNumber}` : ''}, ${color}/${clarity}/${cut}): $${diamondPrice.toLocaleString('en-US')}\nTotal: $${total.toLocaleString('en-US')} · Balance of $${balance.toLocaleString('en-US')} due before shipping.`,
            images: heroImage ? [heroImage] : undefined,
            metadata: { sku: setting.sku, nivoda_offer_id: body.diamond_offer_id },
          },
        },
      },
    ],
    metadata: {
      flow: 'ring_builder',
      setting_slug: setting.slug,
      setting_sku: setting.sku,
      nivoda_offer_id: body.diamond_offer_id,
      nivoda_hold_id: body.hold_id ?? '',
      diamond_shape: shape,
      diamond_carat: String(carat),
      diamond_color: color,
      diamond_clarity: clarity,
      diamond_cut: cut,
      total_usd: String(total),
      deposit_usd: String(deposit),
      setting_price_usd: String(settingPrice),
      diamond_price_usd: String(diamondPrice),
    },
    payment_intent_data: {
      metadata: {
        flow: 'ring_builder',
        setting_sku: setting.sku,
        nivoda_offer_id: body.diamond_offer_id,
      },
    },
  });

  // Insert pending order — webhook reconciles to deposit_paid + places Nivoda order
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
    nivoda_offer_id: body.diamond_offer_id,
    nivoda_hold_id: body.hold_id ?? null,
    product_sku: setting.sku,
    product_name: setting.name,
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
        setting: {
          sku: setting.sku,
          slug: setting.slug,
          name: setting.name,
          metal: setting.default_metal,
          price_usd: settingPrice,
          breakdown: settingBreakdown,
        },
        diamond: {
          offer_id: body.diamond_offer_id,
          hold_id: body.hold_id ?? null,
          shape,
          carat,
          color,
          clarity,
          cut,
          lab,
          cert_number: certNumber,
          price_usd: diamondPrice,
        },
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
