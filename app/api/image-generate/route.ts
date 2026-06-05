/**
 * Image generation — Gemini 2.5 Flash Image (paid tier).
 *
 * Two modes:
 *   1. Text-only:    { prompt }                       → studio-photo render.
 *   2. Text + ref:   multipart { prompt, image }      → conditions on image.
 *
 * Generated image is uploaded to the `client-uploads` Supabase Storage
 * bucket and returned as a 30-day signed URL plus inline base64 (so the
 * client can render even if storage upload fails).
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { createServiceClient } from '@/lib/supabase/server';
import { IMAGE_MODEL_PRIMARY, IMAGE_MODEL_FALLBACK } from '@/lib/gemini';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const MAX_REF_BYTES = 12 * 1024 * 1024;
const ALLOWED_REF_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// Anchor every generation in the DANHOV studio style.
const STYLE_HEADER = `Generate ONE photograph of luxury fine jewelry in the unmistakable DANHOV studio style:
- Handcrafted in 14k or 18k gold (yellow, white, or rose). Never platinum, silver, palladium.
- Museum-quality studio macro: warm soft key light from upper left, gentle fill, deep velvet-black or soft cream backdrop.
- Sharp tack focus on the metalwork and stones. Realistic micro-detail in the gold finish (file marks, polish reflections).
- Color: rich warm tones, no oversaturation. Diamonds should refract with cool white sparkle, no rainbow halos.
- Composition: centered hero shot, square 1:1, generous negative space, no text, no watermarks, no logos, no people unless the customer explicitly asks.
- Mood: quiet, sacred, considered. Like a piece earned over a lifetime, not a thing produced.

Customer's request: `;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip, 'image-generate', 5, 60 * 60 * 1000); // 5 per hour
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
  }

  let prompt = '';
  let referenceImage: { data: string; mime: string } | null = null;

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    prompt = form.get('prompt')?.toString().trim() || '';
    const file = form.get('image');
    if (file instanceof Blob && file.size > 0) {
      if (file.size > MAX_REF_BYTES) {
        return NextResponse.json(
          { error: 'Reference image too large (max 12 MB)' },
          { status: 413 }
        );
      }
      const mime = (file.type || 'image/jpeg').split(';')[0].toLowerCase();
      if (!ALLOWED_REF_MIMES.has(mime)) {
        return NextResponse.json(
          { error: `Unsupported reference type: ${mime}` },
          { status: 415 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      referenceImage = { data: buf.toString('base64'), mime };
    }
  } else {
    const body = await req.json().catch(() => ({}));
    prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  }

  if (!prompt || prompt.length < 3) {
    return NextResponse.json(
      { error: 'Please describe the piece you want to see.' },
      { status: 400 }
    );
  }
  if (prompt.length > 2000) {
    return NextResponse.json(
      { error: 'Prompt is too long (2000 chars max).' },
      { status: 400 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const fullPrompt = STYLE_HEADER + prompt;
  const parts: Part[] = [{ text: fullPrompt }];
  if (referenceImage) {
    parts.unshift({
      inlineData: { data: referenceImage.data, mimeType: referenceImage.mime },
    });
    parts.push({
      text: '\n\nThe attached image is INSPIRATION for silhouette, style, or hand pose. Re-render entirely in the DANHOV studio style described above — do not copy the source verbatim.',
    });
  }

  const models = [IMAGE_MODEL_PRIMARY, ...IMAGE_MODEL_FALLBACK];

  let imageBuffer: Buffer | null = null;
  let usedModel = IMAGE_MODEL_PRIMARY;
  let lastErr: Error | null = null;

  for (const modelId of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(parts);
      const candidates = result.response.candidates ?? [];
      for (const c of candidates) {
        for (const p of c.content?.parts ?? []) {
          if (p.inlineData?.data) {
            imageBuffer = Buffer.from(p.inlineData.data, 'base64');
            break;
          }
        }
        if (imageBuffer) break;
      }
      if (imageBuffer) {
        usedModel = modelId;
        break;
      }
      lastErr = new Error(`${modelId} returned no image data`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastErr = err instanceof Error ? err : new Error(message);
      if (!/429|503|404|quota|exceeded|unavailable/i.test(message)) break;
    }
  }

  if (!imageBuffer) {
    console.error('image-generate failed', lastErr);
    return NextResponse.json(
      {
        error:
          'Image rendering is briefly unavailable. Please try again in a moment, or describe your vision and our advisor will respond by message.',
      },
      { status: 503 }
    );
  }

  // Persist to storage so the customer can come back / download
  let blobPath: string | null = null;
  let publicUrl: string | null = null;
  try {
    const client = createServiceClient();
    const filename = `generated/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.png`;
    const { error } = await client.storage
      .from('client-uploads')
      .upload(filename, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
    if (!error) {
      blobPath = filename;
      const { data: signed } = await client.storage
        .from('client-uploads')
        .createSignedUrl(filename, 60 * 60 * 24 * 30); // 30-day signed URL
      publicUrl = signed?.signedUrl ?? null;
    }
  } catch (e) {
    console.error('image-generate storage upload failed', e);
  }

  const base64 = imageBuffer.toString('base64');
  return NextResponse.json({
    image_base64: base64,
    mime: 'image/png',
    url: publicUrl,
    storage_path: blobPath,
    model: usedModel,
  });
}
