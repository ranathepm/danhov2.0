import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const code = (body.code ?? '').trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: 'Gift card code is required.' }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from('gift_cards')
    .select('code, amount_usd, status, redeemed_at, recipient_name')
    .eq('code', code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Gift card not found. Please check the code and try again.' }, { status: 404 });
  }

  return NextResponse.json({
    card: {
      code: data.code,
      amount_usd: data.amount_usd,
      status: data.status,
      redeemed_at: data.redeemed_at,
      recipient_name: data.recipient_name,
    },
  });
}
