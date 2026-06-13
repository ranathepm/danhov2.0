/**
 * Concierge Checkout — Stripe Checkout session for the 50% deposit on a
 * locked quote.
 *
 * Flow:
 *   1. Client posts { quote_id, email } (the quote_id from /api/lock-quote)
 *   2. We look up the lock, confirm it's not expired or consumed
 *   3. Create a Stripe Checkout Session for the deposit (50% of locked price)
 *   4. Insert a pending `orders` row tied to this session
 *   5. Return the session URL — the client redirects there
 *
 * Webhook (/api/checkout/webhook) handles the post-payment transition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe, DEPOSIT_PERCENT } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  quote_id: z.string().uuid(),
  email: z.string().email().max(254).optional(),
});

export async function POST(req: NextRequest) {
  // Fail fast if Stripe isn't configured — keeps us from leaving a
  // dangling `pending` order in the DB.
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          'Online deposits are not yet enabled. Please reply to your lock confirmation email or call 1 (888) DANHOV-7 and we will take payment by phone.',
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

  const client = createServiceClient();

  // 1) Fetch the lock + the product it points at
  const { data: lock, error: lockErr } = await client
    .from('quote_locks')
    .select(
      'id, product_id, customer_email, metal_choice, locked_price_usd, expires_at, consumed, breakdown'
    )
    .eq('id', body.quote_id)
    .maybeSingle();

  if (lockErr || !lock) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }
  if (lock.consumed) {
    return NextResponse.json({ error: 'This quote has already been used.' }, { status: 410 });
  }
  if (new Date(lock.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This quote has expired. Please lock a new price.' }, { status: 410 });
  }

  const { data: product } = await client
    .from('products')
    .select('sku, name, slug, images, collection, category')
    .eq('id', lock.product_id)
    .maybeSingle();
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const customerEmail = (body.email || lock.customer_email || '').toLowerCase();
  if (!customerEmail) {
    return NextResponse.json({ error: 'Customer email required' }, { status: 400 });
  }

  const totalUsd = Number(lock.locked_price_usd);
  const depositUsd = Math.round(totalUsd * DEPOSIT_PERCENT);
  const balanceUsd = totalUsd - depositUsd;

  const stripe = getStripe();
  const host    = req.headers.get('host') ?? '';
  const proto   = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;

  // 2) Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/product/${product.slug}`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: depositUsd * 100,
          product_data: {
            name: `${product.name} (Style ${product.sku})`,
            description: `Locked at $${totalUsd.toLocaleString('en-US')} in ${(lock.metal_choice || '').replace(/_/g, ' ')}. Balance of $${balanceUsd.toLocaleString('en-US')} due before shipping.`,
            images: product.images && Array.isArray(product.images) && product.images[0] ? [product.images[0] as string] : undefined,
            metadata: { sku: product.sku, slug: product.slug },
          },
        },
      },
    ],
    metadata: {
      quote_id: lock.id,
      product_sku: product.sku,
      product_slug: product.slug,
      metal_choice: lock.metal_choice ?? '',
      total_usd: String(totalUsd),
      deposit_usd: String(depositUsd),
    },
    payment_intent_data: {
      metadata: {
        quote_id: lock.id,
        product_sku: product.sku,
      },
    },
  });

  // 3) Insert pending order row (idempotent on stripe_checkout_session_id)
  await client
    .from('customers')
    .upsert({ email: customerEmail }, { onConflict: 'email' });

  const { error: orderErr } = await client.from('orders').insert({
    customer_email: customerEmail,
    quote_lock_id: lock.id,
    stripe_checkout_session_id: session.id,
    deposit_usd: depositUsd,
    total_usd: totalUsd,
    status: 'pending',
    currency: 'usd',
    milestones: [
      { name: 'deposit', amount_usd: depositUsd, status: 'pending', created_at: new Date().toISOString() },
      { name: 'balance', amount_usd: balanceUsd, status: 'not_due' },
    ],
  });
  if (orderErr) {
    console.error('checkout/create order insert', orderErr);
    // we still let the customer complete payment — webhook will reconcile
  }

  return NextResponse.json({ url: session.url, session_id: session.id });
}
