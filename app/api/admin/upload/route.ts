import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
]);
const BUCKET = 'product-images';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'file missing' }, { status: 400 });

  const mime = (file.type || 'image/jpeg').split(';')[0].toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json({ error: `Unsupported type: ${mime}` }, { status: 415 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Size must be 1 B – ${MAX_BYTES} bytes` }, { status: 413 });
  }

  const sb = createServiceClient();

  // Make sure the bucket exists + is public (idempotent attempt)
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => undefined);

  const ext = mime.split('/')[1].replace(/[^a-z0-9]/gi, '') || 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await sb.storage
    .from(BUCKET)
    .upload(name, buf, { contentType: mime, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data } = sb.storage.from(BUCKET).getPublicUrl(name);
  return NextResponse.json({ url: data.publicUrl, name });
}
