import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { key?: string; value?: string; category?: string; description?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body.key || typeof body.value !== 'string' || !body.category) {
    return NextResponse.json({ error: 'key, value, category required' }, { status: 400 });
  }

  const sb = createServiceClient();
  const { error } = await sb.from('site_content').upsert(
    {
      key: body.key,
      value: body.value,
      category: body.category,
      description: body.description ?? null,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    },
    { onConflict: 'key' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const key = new URL(req.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const sb = createServiceClient();
  const { error } = await sb.from('site_content').delete().eq('key', key);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
