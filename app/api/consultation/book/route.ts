/**
 * Fallback "request a consultation" endpoint — used if Calendly isn't
 * wired up yet, or if the customer prefers to send a plain inquiry. Pure
 * Supabase write + email notify Jack.
 *
 * Calendly bookings come through /api/consultation/webhook instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  customer_email: z.string().email().max(254),
  customer_name: z.string().max(120).optional(),
  preferred_time: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const client = createServiceClient();

  // Lightweight customer record
  await client
    .from('customers')
    .upsert(
      { email: body.customer_email.toLowerCase(), name: body.customer_name ?? null },
      { onConflict: 'email' }
    );

  const { data: row, error } = await client
    .from('consultations')
    .insert({
      customer_email: body.customer_email.toLowerCase(),
      customer_name: body.customer_name ?? null,
      notes: [body.preferred_time, body.notes].filter(Boolean).join(' — ') || null,
      status: 'requested',
    })
    .select('id, customer_email, customer_name, notes, status, created_at')
    .single();

  if (error || !row) {
    console.error('consultation/book insert', error);
    return NextResponse.json({ error: 'Could not record request' }, { status: 500 });
  }

  // Notify Jack's studio (best-effort)
  void sendEmail({
    to: 'care@danhov.com',
    subject: `New consultation request — ${row.customer_name || row.customer_email}`,
    html: `<p>A new private consultation has been requested.</p>
<p><strong>Name:</strong> ${escapeHtml(row.customer_name || '—')}<br/>
<strong>Email:</strong> ${escapeHtml(row.customer_email)}<br/>
<strong>Notes:</strong> ${escapeHtml(row.notes || '—')}</p>
<p>Reach out to confirm a time.</p>`,
    replyTo: row.customer_email,
  }).catch((e) => console.error('consultation/book notify failed', e));

  return NextResponse.json({ id: row.id, status: row.status });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}
