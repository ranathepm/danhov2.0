import { NextRequest, NextResponse } from 'next/server';
import { bufferToPart, describeMedia } from '@/lib/gemini';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

// Paid tier — Gemini inline parts allow up to 20 MB.
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
]);

const Fields = z.object({
  session_id: z.string().min(1).max(120).optional(),
  context: z.string().max(500).optional(),
  product_slug: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'vision', 8, 24 * 60 * 60 * 1000); // 8 per 24hr
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form body' }, { status: 400 });
  }

  const file = form.get('media');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'media file missing' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Upload must be 1 B – ${MAX_BYTES} bytes` },
      { status: 413 }
    );
  }

  // Browsers append codec info (e.g. "video/webm;codecs=vp9,opus"). Strip it.
  const rawMime = file.type || 'image/jpeg';
  const mime = rawMime.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIMES.has(mime)) {
    return NextResponse.json(
      { error: `Unsupported media type: ${mime}` },
      { status: 415 }
    );
  }

  const parsed = Fields.safeParse({
    session_id: form.get('session_id')?.toString(),
    context: form.get('context')?.toString(),
    product_slug: form.get('product_slug')?.toString(),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = mime.startsWith('video/') ? 'video' : 'image';

  // Build a context-aware prompt
  let promptHint = '';
  if (kind === 'video') {
    promptHint = `The customer just shared a short video clip — likely of their hand, a piece they admire, or them speaking about their vision. Analyse the full video, not just the first frame:
- If they spoke, register their words AND the tone in which they spoke them.
- If their hand is visible, note finger length, skin undertone (warm/cool/neutral), and any existing rings.
- If another brand's piece appears, identify its style language and recommend the DANHOV collection that captures the same spirit, by name.
- Note lighting, environment, occasion cues (a proposal? a casual day?).

Then respond as their DANHOV advisor — 3 to 6 warm, specific sentences. Always name at least one DANHOV collection (Abbraccio / Voltaggio / Classico / Carezza / Per Lei / Petalo / Solo Filo / Eleganza / Norme de Danhov / Couture / Unito) and the metal you'd recommend. If you would benefit from one detail to be more useful (size, occasion), ask it gently at the end.`;
  } else {
    promptHint = `The customer just shared a photo — likely their hand, a ring they're considering, or inspiration. Look carefully:
- If a hand is visible: finger length and shape, skin undertone (warm/cool/neutral), any existing jewelry, what would flatter them.
- If a piece is visible: identify style language (solitaire / halo / three-stone / tension / twist / pavé / signet / chain / etc), metal colour, approximate stone size if discernible.
- If another brand's piece is visible: name the DANHOV equivalent that captures the same feeling.
- Note lighting, environment, mood, occasion cues.

Then respond as their DANHOV advisor — 3 to 6 warm, specific sentences. Always name at least one DANHOV collection (Abbraccio / Voltaggio / Classico / Carezza / Per Lei / Petalo / Solo Filo / Eleganza / Norme de Danhov / Couture / Unito) and the metal you'd recommend. Acknowledge one specific detail you observed so they know you really looked.`;
  }
  if (parsed.data.product_slug)
    promptHint += `\n\nThey are currently on the product page for '${parsed.data.product_slug}'.`;

  let reply: string;
  try {
    reply = await describeMedia(
      [bufferToPart(buffer, mime)],
      promptHint,
      parsed.data.context,
      { maxOutputTokens: 1400, temperature: 0.65 }
    );
  } catch (err) {
    console.error('vision/gemini error:', err);
    return NextResponse.json(
      { error: 'Vision service unavailable. Please try again shortly.' },
      { status: 503 }
    );
  }

  // Upload to Supabase Storage + record metadata (fire-and-forget)
  let blobUrl: string | null = null;
  try {
    blobUrl = await uploadMedia(buffer, mime, kind);
  } catch (e) {
    console.error('vision/upload error:', e);
  }

  void persistVision(
    parsed.data.session_id ?? 'sess_' + Math.random().toString(36).slice(2, 12),
    parsed.data.context ?? null,
    kind,
    mime,
    file.size,
    blobUrl,
    reply
  ).catch((e) => console.error('vision/persist error:', e));

  return NextResponse.json({ reply, kind });
}

async function uploadMedia(
  buffer: Buffer,
  mime: string,
  kind: 'image' | 'video'
): Promise<string | null> {
  const client = createServiceClient();
  const ext = mime.split('/')[1].replace(/[^a-z0-9]/gi, '') || 'bin';
  const filename = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await client.storage.from('client-uploads').upload(filename, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('storage upload error:', error.message);
    return null;
  }
  return filename;
}

async function persistVision(
  sessionId: string,
  context: string | null,
  kind: 'image' | 'video',
  mime: string,
  bytes: number,
  blobUrl: string | null,
  reply: string
) {
  const client = createServiceClient();
  const { data: conv } = await client
    .from('conversations')
    .upsert(
      {
        session_id: sessionId,
        context,
        modality: 'video',
        messages: [{ role: 'assistant', content: reply }],
      },
      { onConflict: 'session_id' }
    )
    .select('id')
    .single();
  if (!conv) return;

  await client.from('media_uploads').insert({
    conversation_id: conv.id,
    kind,
    blob_url: blobUrl ?? '(not stored)',
    mime_type: mime,
    size_bytes: bytes,
    processed_at: new Date().toISOString(),
    vision_analysis: { reply },
  });
}
