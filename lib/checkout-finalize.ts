/**
 * Server-side reconciliation of a Stripe Checkout session against our
 * orders table.
 *
 * The /api/checkout/webhook handler is the primary path for moving an
 * order from `pending` → `deposit_paid` — but webhooks are only as
 * reliable as the env config behind them. If STRIPE_WEBHOOK_SECRET
 * isn't set, or the endpoint URL isn't configured in the Stripe
 * dashboard, or Stripe is retrying, the order can sit at `pending`
 * indefinitely while the customer's money is already collected.
 *
 * `finalizeCheckoutSession()` is a defensive second path: when a
 * customer lands on /order/success, we re-fetch the session straight
 * from Stripe, confirm payment_status === 'paid', and write the same
 * `deposit_paid` transition the webhook would have. Idempotent — if
 * the webhook fired first, we early-return.
 */

import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';

export type FinalizeResult = {
  status: 'completed' | 'pending' | 'not_found' | 'unconfigured';
  order_id?: string;
  product_name?: string | null;
  deposit_usd?: number;
};

export async function finalizeCheckoutSession(
  sessionId: string,
): Promise<FinalizeResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { status: 'unconfigured' };
  }

  const client = createServiceClient();
  const { data: order, error } = await client
    .from('orders')
    .select(
      'id, status, milestones, deposit_usd, total_usd, customer_email, product_name, product_sku, quote_lock_id, shipping_address',
    )
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (error || !order) {
    return { status: 'not_found' };
  }

  // Already reconciled (webhook beat us to it, or this is a re-load of
  // the success page after the previous reconciliation succeeded).
  if (order.status !== 'pending') {
    return {
      status: 'completed',
      order_id: order.id,
      product_name: order.product_name,
      deposit_usd: Number(order.deposit_usd),
    };
  }

  // Verify the session paid status with Stripe before flipping our
  // local state — never trust the session_id alone.
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error('[checkout-finalize] stripe retrieve failed:', e);
    return { status: 'pending', order_id: order.id };
  }

  if (session.payment_status !== 'paid') {
    return { status: 'pending', order_id: order.id };
  }

  // Move deposit milestone → paid, mirroring the webhook's logic.
  const milestones =
    (order.milestones as Array<{ name: string; status: string; paid_at?: string }>) ||
    [];
  const nextMilestones = milestones.map((m) =>
    m.name === 'deposit'
      ? { ...m, status: 'paid', paid_at: new Date().toISOString() }
      : m,
  );

  const { error: updateErr } = await client
    .from('orders')
    .update({
      status: 'deposit_paid',
      milestones: nextMilestones,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      shipping_country: session.customer_details?.address?.country ?? null,
    })
    .eq('id', order.id)
    // Race guard — only flip if we still see `pending`. If the webhook
    // raced us and already wrote `deposit_paid`, the update affects
    // zero rows and we silently no-op.
    .eq('status', 'pending');

  if (updateErr) {
    console.error('[checkout-finalize] order update failed:', updateErr);
    return { status: 'pending', order_id: order.id };
  }

  // Consume the quote lock if this order had one (legacy concierge flow).
  if (order.quote_lock_id) {
    await client
      .from('quote_locks')
      .update({ consumed: true })
      .eq('id', order.quote_lock_id);
  }

  return {
    status: 'completed',
    order_id: order.id,
    product_name: order.product_name,
    deposit_usd: Number(order.deposit_usd),
  };
}
