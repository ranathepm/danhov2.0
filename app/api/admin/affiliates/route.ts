import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchBody = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected']),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const sb = createServiceClient();
  const update: Record<string, string> = { status: body.status };
  if (body.notes !== undefined) update.notes = body.notes;

  const { error } = await sb
    .from('affiliate_applications')
    .update(update)
    .eq('id', body.id);

  if (error) {
    console.error('admin/affiliates PATCH:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
