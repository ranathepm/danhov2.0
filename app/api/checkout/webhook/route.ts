/**
 * Stripe webhook receiver.
 *
 *   checkout.session.completed   → mark order deposit_paid, consume the quote
 *                                  lock, send deposit receipt to customer
 *                                  + studio notification to Jack.
 *
 *   payment_intent.payment_failed → mark order failed.
 *
 * Set the endpoint in Stripe Dashboard:
 *   Developers → Webhooks → Add endpoint
 *   URL: https://YOUR-DOMAIN/api/checkout/webhook
 *   Events: checkout.session.completed, payment_intent.payment_failed
 *   Copy "Signing secret" → STRIPE_WEBHOOK_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail, depositReceiptEmail } from '@/lib/email';
import { createOrder as nivodaCreateOrder, NIVODA_PRO_ENABLED } from '@/lib/nivoda';
import { isFallbackOffer } from '@/lib/nivoda-fallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature') || '';
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const client = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await onCheckoutCompleted(client, session);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await onPaymentFailed(client, pi);
      break;
    }
    default:
      // ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}

async function onCheckoutCompleted(
  client: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
) {
  if (session.payment_status !== 'paid') return;

  // Look up our order row by checkout session id
  const { data: order } = await client
    .from('orders')
    .select('id, customer_email, quote_lock_id, deposit_usd, total_usd, status, milestones, nivoda_offer_id, shipping_address')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();

  if (!order) {
    console.warn('webhook: no order matches session', session.id);
    return;
  }

  // Already processed? Skip.
  if (order.status !== 'pending') return;

  const milestones = (order.milestones as Array<{ name: string; status: string; paid_at?: string }>) || [];
  const updated = milestones.map((m) =>
    m.name === 'deposit'
      ? { ...m, status: 'paid', paid_at: new Date().toISOString() }
      : m
  );

  await client
    .from('orders')
    .update({
      status: 'deposit_paid',
      milestones: updated,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      shipping_country: session.customer_details?.address?.country ?? null,
      last_email_sent_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  // Mark the quote lock as consumed
  if (order.quote_lock_id) {
    await client
      .from('quote_locks')
      .update({ consumed: true })
      .eq('id', order.quote_lock_id);
  }

  // Resolve product info for the email
  const sku = (session.metadata?.product_sku as string) || '—';
  const slug = (session.metadata?.product_slug as string) || '';
  let productName = sku;
  if (slug) {
    const { data: p } = await client
      .from('products')
      .select('name')
      .eq('slug', slug)
      .maybeSingle();
    if (p?.name) productName = p.name;
  }

  // Receipt to customer
  const customerEmail = order.customer_email;
  const tpl = depositReceiptEmail({
    productName,
    sku,
    depositUsd: Number(order.deposit_usd),
    totalUsd: Number(order.total_usd),
    orderId: order.id,
  });
  if (customerEmail) {
    await sendEmail({ to: customerEmail, ...tpl });
  }

  // Place the Nivoda order (ring builder flow only). The offer id was
  // captured on the orders row when the customer selected their diamond.
  // We do this AFTER updating the DANHOV order status so a Nivoda failure
  // doesn't block the deposit_paid transition.
  const offerId = (order.nivoda_offer_id as string | null) ?? extractOfferFromBundle(order.shipping_address);
  // Skip auto-order placement for fallback stones — those need specialist
  // confirmation to source a real comparable stone before any Nivoda call.
  if (offerId && NIVODA_PRO_ENABLED && !isFallbackOffer(offerId)) {
    try {
      const ref = `DH-${order.id.slice(0, 8).toUpperCase()}`;
      const r = await nivodaCreateOrder({ offerId, orderReference: ref });
      if (r.ok) {
        await client
          .from('orders')
          .update({
            nivoda_offer_id: offerId,
            nivoda_order_id: r.data.id ?? null,
          })
          .eq('id', order.id);
        await client
          .from('nivoda_holds')
          .update({ status: 'converted', updated_at: new Date().toISOString() })
          .eq('offer_id', offerId)
          .eq('status', 'active');
        console.log('nivoda order placed', { danhov: order.id, nivoda: r.data.id });
      } else {
        console.error('nivoda order failed', { danhov: order.id, error: r.error });
        // Notify studio so they can place the Nivoda order manually
        await sendEmail({
          to: 'care@danhov.com',
          subject: `[Action needed] Nivoda order failed for ${order.id.slice(0, 8).toUpperCase()}`,
          html: `<p>Stripe deposit was received but the Nivoda order placement failed.</p>
<p>
  <strong>DANHOV order:</strong> ${order.id}<br/>
  <strong>Offer ID:</strong> ${offerId}<br/>
  <strong>Error:</strong> ${escapeHtml(r.error)}
</p>
<p>Please place the order manually in the Nivoda dashboard, then update the DANHOV order with the Nivoda order id.</p>`,
        });
      }
    } catch (e) {
      console.error('nivoda order threw', e);
    }
  }

  // Studio notification
  await sendEmail({
    to: 'care@danhov.com',
    subject: `[Deposit paid] ${productName} (${sku}) — ${order.id.slice(0, 8).toUpperCase()}`,
    html: `<p>A new commission deposit has been received.</p>
<p>
  <strong>Customer:</strong> ${escapeHtml(customerEmail || '—')}<br/>
  <strong>Piece:</strong> ${escapeHtml(productName)} — Style ${escapeHtml(sku)}<br/>
  <strong>Deposit:</strong> $${Number(order.deposit_usd).toLocaleString('en-US')}<br/>
  <strong>Total:</strong> $${Number(order.total_usd).toLocaleString('en-US')}<br/>
  <strong>Order:</strong> ${order.id}
</p>
<p>Confirm details with the customer within one business day.</p>`,
    replyTo: customerEmail || undefined,
  });
}

async function onPaymentFailed(
  client: ReturnType<typeof createServiceClient>,
  pi: Stripe.PaymentIntent
) {
  await client
    .from('orders')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', pi.id);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}

/**
 * Older orders stashed the ring-builder bundle (including the Nivoda
 * offer id) in shipping_address._bundle.diamond.offer_id. This pulls it
 * back out as a fallback when nivoda_offer_id wasn't set explicitly.
 */
function extractOfferFromBundle(addr: unknown): string | null {
  if (!addr || typeof addr !== 'object') return null;
  const bundle = (addr as { _bundle?: { diamond?: { offer_id?: string } } })._bundle;
  return bundle?.diamond?.offer_id ?? null;
}
