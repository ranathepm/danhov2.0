/**
 * Cart checkout — Stripe Checkout for everything in the customer's cart.
 *
 * Flow:
 *   1. Client posts { items: [{ sku, qty, metal }], email }
 *   2. Server re-fetches each product by SKU and re-computes the live
 *      price (so a stale localStorage cart can't underpay)
 *   3. Builds line items at 50% deposit, creates a Stripe Checkout Session
 *   4. Inserts ONE pending `orders` row with the cart bundle in
 *      shipping_address._bundle.cart_items for the webhook to reconcile
 *   5. Returns the Checkout URL → client redirects
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe, DEPOSIT_PERCENT } from '@/lib/stripe';
import { priceProduct } from '@/lib/pricing';
import { fetchProductWithPricingBySlug } from '@/lib/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Item = z.object({
  sku: z.string().min(1).max(80),
  slug: z.string().min(1).max(120),
  qty: z.number().int().min(1).max(99),
  metal: z.string().nullable().optional(),
  ring_size: z.string().nullable().optional(),
  bundle: z
    .object({
      setting_price_usd: z.number().nonnegative(),
      diamond: z.object({
        offer_id: z.string().min(1),
        hold_id: z.string().nullable(),
        shape: z.string(),
        carat: z.number().nonnegative(),
        color: z.string(),
        clarity: z.string(),
        cut: z.string(),
        lab: z.string().nullable(),
        cert_number: z.string().nullable(),
        price_usd: z.number().nonnegative(),
        image: z.string().nullable(),
      }),
    })
    .nullable()
    .optional(),
});

const Body = z.object({
  items: z.array(Item).min(1).max(20),
  email: z.string().email().max(254),
});

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          'Online deposits are not yet enabled. Reply to your sign-in email or call 1 (888) DANHOV-7 and we will take payment by phone.',
      },
      { status: 503 }
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    console.error('[cart/checkout] invalid body:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Re-fetch and re-price every line item server-side. Never trust
  // a price that came from the client's localStorage cart.
  //
  // Two pricing paths:
  //  • plain setting → fetch the product, run priceProduct() with the
  //    customer's chosen metal, total = setting price
  //  • bundle (setting + diamond + size) → fetch the setting to confirm
  //    it still exists, then sum the stored bundle prices. We don't
  //    re-price the diamond from Nivoda here (we'd need a separate
  //    fresh-fetch + hold) — the studio reconciles the Nivoda quote at
  //    fulfilment using the offer_id stored on the order.
  type Priced = {
    sku: string;
    slug: string;
    name: string;
    metal: string | null;
    qty: number;
    unit_price_usd: number;
    image: string | null;
    ring_size: string | null;
    bundle: z.infer<typeof Item>['bundle'];
  };
  const priced: Priced[] = [];
  for (const it of body.items) {
    const product = await fetchProductWithPricingBySlug(it.slug);
    if (!product) {
      return NextResponse.json(
        { error: `One of your pieces (${it.sku}) is no longer available. Please remove it and try again.` },
        { status: 410 }
      );
    }
    const metal = it.metal || product.default_metal || null;
    let unitPrice = 0;

    if (it.bundle) {
      // Bundle row — use the stored prices for both halves. They were
      // computed at the moment the customer selected the diamond, so
      // they reflect the price the customer agreed to lock.
      unitPrice = it.bundle.setting_price_usd + it.bundle.diamond.price_usd;
    } else {
      try {
        const breakdown = await priceProduct(product, metal);
        unitPrice = breakdown.total_usd;
      } catch (e) {
        console.error('[cart/checkout] pricing failed for', it.sku, e);
        // fallback to the price_display number if live pricing failed
        const m = product.price_display?.match(/[\d,]+/);
        unitPrice = m ? Number(m[0].replace(/,/g, '')) : 0;
      }
    }

    if (unitPrice <= 0) {
      return NextResponse.json(
        { error: `Could not price ${product.name}. Please contact us at care@danhov.com.` },
        { status: 502 }
      );
    }
    priced.push({
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      metal,
      qty: it.qty,
      unit_price_usd: unitPrice,
      image: product.images?.[0] ?? null,
      ring_size: it.ring_size ?? null,
      bundle: it.bundle ?? null,
    });
  }

  const totalUsd = priced.reduce((sum, p) => sum + p.unit_price_usd * p.qty, 0);
  const depositUsd = Math.round(totalUsd * DEPOSIT_PERCENT);
  const balanceUsd = totalUsd - depositUsd;

  const customerEmail = body.email.toLowerCase();
  const stripe = getStripe();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://danhov-web.vercel.app';

  // Build Stripe line items — one per cart piece
  const lineItems = priced.map((p) => {
    const unitAmount = Math.round(p.unit_price_usd * DEPOSIT_PERCENT);
    const diamondSummary = p.bundle
      ? ` + ${p.bundle.diamond.carat.toFixed(2)}ct ${p.bundle.diamond.shape.toLowerCase()} ${p.bundle.diamond.color}/${p.bundle.diamond.clarity}`
      : '';
    const sizeSuffix = p.ring_size ? ` · Size ${p.ring_size}` : '';
    return {
      quantity: p.qty,
      price_data: {
        currency: 'usd' as const,
        unit_amount: unitAmount * 100,
        product_data: {
          name: `${p.name}${diamondSummary}${p.metal ? ` · ${p.metal}` : ''}${sizeSuffix}`,
          description: `Style ${p.sku}`,
          images: p.image ? [p.image] : undefined,
          metadata: { sku: p.sku, slug: p.slug, metal: p.metal ?? '' },
        },
      },
    };
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart`,
    line_items: lineItems,
    metadata: {
      flow: 'cart',
      total_usd: String(totalUsd),
      deposit_usd: String(depositUsd),
      item_count: String(priced.length),
    },
    payment_intent_data: {
      metadata: {
        flow: 'cart',
        item_count: String(priced.length),
      },
    },
  });

  // Persist a single pending order with the cart bundle so the webhook
  // can mark it deposit_paid on success.
  const client = createServiceClient();
  await client.from('customers').upsert({ email: customerEmail }, { onConflict: 'email' });
  await client.from('orders').insert({
    customer_email: customerEmail,
    stripe_checkout_session_id: session.id,
    deposit_usd: depositUsd,
    total_usd: totalUsd,
    status: 'pending',
    currency: 'usd',
    product_sku: priced.map((p) => p.sku).join(','),
    product_name: priced.map((p) => p.name).join(' · '),
    milestones: [
      {
        name: 'deposit',
        amount_usd: depositUsd,
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      { name: 'balance', amount_usd: balanceUsd, status: 'not_due' },
    ],
    shipping_address: {
      _bundle: {
        flow: 'cart',
        cart_items: priced,
      },
    },
  });

  return NextResponse.json({ url: session.url, session_id: session.id });
}
