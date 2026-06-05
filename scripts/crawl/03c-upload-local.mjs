/**
 * Stage 3c — upload the local image mirror (built by 03b) to the Supabase
 * Storage `product-images` bucket.
 *
 * Reads galleries.json for the canonical danhov URLs, maps each to its local
 * file (same key scheme as 03b) and its storage key, and uploads. Records the
 * danhov URL → { key, publicUrl, bytes } map in uploads.json (the same file
 * 04-build-catalog.mjs consumes). Resumable: URLs already in uploads.json are
 * skipped; URLs whose local file is missing are skipped (download them first).
 *
 * Upload uses supabase-js (talks only to Supabase, which was stable). Each
 * upload is wrapped in a hard timeout so a wedged connection can't freeze a
 * worker, and the file is read fresh from disk per upload.
 *
 * Run:  node scripts/crawl/03c-upload-local.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { statSync, readFileSync } from 'node:fs';
import { pool, readState, writeState, withTimeout, sleep } from './lib.mjs';
import { keyForUrl, localPathFor } from './03b-download-local.mjs';

config({ path: '.env.local' });

const BUCKET = 'product-images';
const CONCURRENCY = 4;
const CHECKPOINT_EVERY = 100;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

function contentTypeFor(url) {
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

  const urlSet = new Set();
  for (const p of Object.values(galleries)) for (const u of p.images || []) urlSet.add(u);
  const allUrls = [...urlSet];

  // Only URLs not yet uploaded AND present locally.
  const todo = [];
  let missingLocal = 0;
  for (const u of allUrls) {
    if (uploads[u]) continue;
    try {
      if (statSync(localPathFor(u)).size > 0) todo.push(u);
      else missingLocal++;
    } catch {
      missingLocal++;
    }
  }

  console.log(
    `→ ${allUrls.length} unique · ${Object.keys(uploads).length} already uploaded · ${todo.length} to upload · ${missingLocal} not yet downloaded\n`
  );

  let done = 0;
  let ok = 0;
  let failed = 0;
  let bytesTotal = 0;

  await pool(todo, CONCURRENCY, async (url) => {
    const key = keyForUrl(url);
    try {
      const buffer = readFileSync(localPathFor(url));
      const contentType = contentTypeFor(url);
      const { error } = await withTimeout(
        sb.storage.from(BUCKET).upload(key, buffer, { contentType, upsert: true }),
        30000,
        'upload'
      );
      if (error) {
        failed++;
        failures[url] = { error: error.message, key };
      } else {
        const publicUrl = sb.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
        uploads[url] = { key, publicUrl, bytes: buffer.length, contentType };
        delete failures[url];
        ok++;
        bytesTotal += buffer.length;
      }
    } catch (e) {
      failed++;
      failures[url] = { error: String(e?.message || e), key };
    }
    done++;
    if (done % CHECKPOINT_EVERY === 0) {
      writeState('uploads.json', uploads);
      writeState('upload-failures.json', failures);
      process.stdout.write(`  …${done}/${todo.length}  ok:${ok} fail:${failed}  (${(bytesTotal / 1e6).toFixed(0)} MB this run)\n`);
    }
  });

  writeState('uploads.json', uploads);
  writeState('upload-failures.json', failures);

  const totalBytes = Object.values(uploads).reduce((n, u) => n + (u.bytes || 0), 0);
  console.log(`\n✓ uploads.json written`);
  console.log(`    uploaded (total): ${Object.keys(uploads).length}/${allUrls.length}`);
  console.log(`    failed this run:  ${failed}`);
  console.log(`    storage size:     ${(totalBytes / 1e9).toFixed(2)} GB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
