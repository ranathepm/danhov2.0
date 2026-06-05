/**
 * Rewrite every product image URL to its canonical (uncached) Magento
 * path — strips the `cache/{hash}/` segment.
 *
 *   before: https://www.danhov.com/media/catalog/product/cache/abc.../a/e/x.jpg
 *   after:  https://www.danhov.com/media/catalog/product/a/e/x.jpg
 *
 * The canonical path serves the full original-resolution upload
 * (~50% larger than the cached/resized version).
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

const CACHE_RE = /\/cache\/[a-f0-9]+\//;

function strip(url) {
  if (typeof url !== 'string') return url;
  return url.replace(CACHE_RE, '/');
}

const { data: products, error } = await supabase
  .from('products')
  .select('sku, images');
if (error) throw error;

let updated = 0;
let unchanged = 0;
for (const p of products) {
  const old = Array.isArray(p.images) ? p.images : [];
  if (old.length === 0) {
    unchanged++;
    continue;
  }
  const next = Array.from(new Set(old.map(strip)));
  // Same set? skip
  if (next.length === old.length && next.every((v, i) => v === old[i])) {
    unchanged++;
    continue;
  }
  const { error: upErr } = await supabase
    .from('products')
    .update({ images: next })
    .eq('sku', p.sku);
  if (upErr) {
    console.error(`✗ ${p.sku}: ${upErr.message}`);
    continue;
  }
  console.log(`  ${p.sku.padEnd(12)} ${old.length} → ${next.length} canonical`);
  updated++;
}

console.log('\n─────────────────────────────────────');
console.log(`✓ Updated:   ${updated}`);
console.log(`= Unchanged: ${unchanged}`);
