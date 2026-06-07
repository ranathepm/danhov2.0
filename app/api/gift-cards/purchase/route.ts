/**
 * Gift Card purchase — creates a Stripe Checkout session.
 *
 * On success, Stripe fires checkout.session.completed → the webhook
 * at /api/checkout/webhook generates the gift card code and emails
 * the recipient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  amount: z.number().int().min(25).max(10000),
  quantity: z.number().int().min(1).max(10),
  for_self: z.boolean().default(false),
  sender_name: z.string().min(1).max(200),
  sender_email: z.string().email().max(254),
  recipient_name: z.string().min(1).max(200),
  recipient_email: z.string().email().max(254),
  message: z.string().max(500).optional().default(''),
  deliver_at: z.string().optional(),
});

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DANHOV-${seg()}-${seg()}-${seg()}`;
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Payment processing is not yet enabled. Please contact care@danhov.com.' },
      { status: 503 }
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { amount, quantity, sender_name, sender_email, recipient_name, recipient_email, message, deliver_at, for_self } = body;

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://danhov.com';

  // Create one pending gift card row per quantity
  const sb = createServiceClient();
  const codes: string[] = [];
  for (let i = 0; i < quantity; i++) {
    codes.push(generateCode());
  }

  // Insert pending rows so we have IDs before Stripe session
  const gcRows = codes.map((code) => ({
    code,
    amount_usd: amount,
    sender_name,
    sender_email: sender_email.toLowerCase(),
    recipient_name,
    recipient_email: recipient_email.toLowerCase(),
    message: message || null,
    deliver_at: deliver_at ? new Date(deliver_at).toISOString() : null,
    status: 'pending',
  }));

  const { data: inserted, error: dbErr } = await sb
    .from('gift_cards')
    .insert(gcRows)
    .select('id, code');

  if (dbErr || !inserted) {
    console.error('gift-cards/purchase db error:', dbErr?.message);
    return NextResponse.json({ error: 'Could not create gift card. Please try again.' }, { status: 500 });
  }

  const cardIds = inserted.map((r: { id: string }) => r.id).join(',');

  const itemName =
    quantity === 1
      ? `DANHOV Gift Card — $${amount.toLocaleString()}`
      : `DANHOV Gift Cards × ${quantity} — $${amount.toLocaleString()} each`;

  const recipientLine = for_self ? 'For yourself' : `For: ${recipient_name} <${recipient_email}>`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: sender_email.toLowerCase(),
    success_url: `${siteUrl}/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/gift-cards/buy`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount * quantity * 100,
          product_data: {
            name: itemName,
            description: `${recipientLine}${message ? ` · "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"` : ''}`,
          },
        },
      },
    ],
    metadata: {
      flow: 'gift_card',
      gift_card_ids: cardIds,
      amount_usd: String(amount),
      quantity: String(quantity),
      sender_name,
      sender_email: sender_email.toLowerCase(),
      recipient_name,
      recipient_email: recipient_email.toLowerCase(),
    },
  });

  // Attach stripe session ID to gift card rows
  await sb
    .from('gift_cards')
    .update({ stripe_session_id: session.id })
    .in('id', inserted.map((r: { id: string }) => r.id));

  return NextResponse.json({ url: session.url, session_id: session.id });
}
