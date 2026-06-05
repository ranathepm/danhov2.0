/**
 * Stage 3 — download every full-resolution image from danhov.com and upload
 * it to the Supabase Storage `product-images` bucket.
 *
 * Storage key mirrors danhov's own media path (the part after
 * /media/catalog/product/), e.g. `a/e/ae520uq_r1_1_wg.jpg`. Because that
 * path is globally unique on danhov, images shared across metal variants are
 * uploaded exactly once.
 *
 * Resumable: uploads.json maps each danhov canonical URL → { key, publicUrl,
 * bytes }. Already-mapped URLs are skipped, so re-running only fills gaps.
 * If the canonical (original-resolution) URL 404s, we fall back to nothing —
 * such URLs are logged in failures.
 *
 * Run:  node scripts/crawl/03-download-upload.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { curlBuffer, pool, readState, writeState, sleep, withTimeout } from './lib.mjs';

config({ path: '.env.local' });

const BUCKET = 'product-images';
const CONCURRENCY = 8;
const CHECKPOINT_EVERY = 100;
// Light pacing to stay polite; curl uses an independent connection per call
// so we don't risk the undici pool wedging that froze the fetch-based version.
const PACE_MS = 40;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const MEDIA_PREFIX = '/media/catalog/product/';

/** danhov canonical URL → storage key (danhov media path, no /cache/). */
function keyForUrl(url) {
  const u = new URL(url);
  let p = u.pathname;
  const i = p.indexOf(MEDIA_PREFIX);
  if (i >= 0) p = p.slice(i + MEDIA_PREFIX.length);
  else p = p.replace(/^\/+/, '');
  // strip any stray leading "cache/<hash>/" just in case
  p = p.replace(/^cache\/[a-f0-9]+\//i, '');
  return p.replace(/^\/+/, '');
}

function contentTypeFor(url, fromHeader) {
  if (fromHeader && fromHeader.startsWith('image/')) return fromHeader;
  const ext = url.split('.').pop().toLowerCase();
  return (
    { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] ||
    'application/octet-stream'
  );
}

async function main() {
  const galleries = readState('galleries.json', {});
  const uploads = readState('uploads.json', {});
  const failures = readState('upload-failures.json', {});

  // Unique set of canonical image URLs across the whole catalog
  const urlSet = new Set();
  for (const p of Object.values(galleries)) for (const u of p.images || []) urlSet.add(u);
  const allUrls = [...urlSet];
  const todo = allUrls.filter((u) => !uploads[u]);

  console.log(`→ ${allUrls.length} unique images · ${todo.length} to upload · ${allUrls.length - todo.length} already done\n`);

  let done = 0;
  let ok = 0;
  let bytesTotal = 0;
  let failed = 0;

  await pool(todo, CONCURRENCY, async (url) => {
    await sleep(PACE_MS);
    const key = keyForUrl(url);
    try {
      const res = await curlBuffer(url);
      if (!res.ok) {
        failed++;
        failures[url] = { error: res.error || `HTTP ${res.status}`, key };
      } else {
        const contentType = contentTypeFor(url, res.contentType);
        // Supabase upload has no internal timeout — guard it hard so a
        // throttled/hung connection can never freeze the worker.
        const { error } = await withTimeout(
          sb.storage.from(BUCKET).upload(key, res.buffer, { contentType, upsert: true }),
          30000,
          'upload'
        );
        if (error) {
          failed++;
          failures[url] = { error: error.message, key };
        } else {
          const publicUrl = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
          uploads[url] = { key, publicUrl, bytes: res.buffer.length, contentType };
          delete failures[url];
          ok++;
          bytesTotal += res.buffer.length;
        }
      }
    } catch (e) {
      failed++;
      failures[url] = { error: String(e?.message || e), key };
    }
    done++;
    if (done % CHECKPOINT_EVERY === 0) {
      writeState('uploads.json', uploads);
      writeState('upload-failures.json', failures);
      process.stdout.write(
        `  …${done}/${todo.length}  ok:${ok} fail:${failed}  (${(bytesTotal / 1e6).toFixed(0)} MB this run)\n`
      );
    }
  });

  writeState('uploads.json', uploads);
  writeState('upload-failures.json', failures);

  const totalBytes = Object.values(uploads).reduce((n, u) => n + (u.bytes || 0), 0);
  console.log(`\n✓ uploads.json written`);
  console.log(`    uploaded (total): ${Object.keys(uploads).length}`);
  console.log(`    failed:           ${Object.keys(failures).length}`);
  console.log(`    storage size:     ${(totalBytes / 1e9).toFixed(2)} GB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
