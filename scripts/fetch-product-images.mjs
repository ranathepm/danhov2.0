/**
 * Scrape multi-image galleries from danhov.com and update Supabase.
 *
 * For each product SKU in our DB:
 *   1. Hit danhov.com's catalog search → Magento redirects to the product page
 *   2. Parse the page HTML for the Magento gallery JSON (`"full":"..."` urls)
 *   3. Dedupe, decode URLs, and upsert into products.images JSONB
 *
 * Rate-limited (500ms between requests) so we don't hammer their server.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const PAUSE_MS = 500;

const FULL_REGEX = /"full":"(https:\\\/\\\/www\.danhov\.com\\\/media\\\/catalog\\\/product\\\/cache\\\/[^"]+?)"/g;

function decodeJsonString(s) {
  // Magento escapes the URL inside JSON — undo it.
  return s.replace(/\\\//g, '/').replace(/\\u002F/g, '/');
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
  });
  return { url: res.url, html: res.ok ? await res.text() : null, status: res.status };
}

/**
 * Two-phase lookup:
 *   1. Hit search URL. If it redirects to a product page → done.
 *   2. If it returns a result list, find the first href containing the
 *      lowercase SKU and follow it.
 */
async function fetchProductPage(sku) {
  const searchUrl = `https://www.danhov.com/catalogsearch/result/?q=${encodeURIComponent(sku)}`;
  const first = await fetchHtml(searchUrl);
  if (!first.html) return first;

  if (!/\/catalogsearch\/result\//.test(first.url)) {
    return first; // direct redirect — we landed on the product page
  }

  // Result list — find the first product link containing the SKU
  const skuLower = sku.toLowerCase();
  const linkRegex = new RegExp(
    `href=\\"(https:\\/\\/www\\.danhov\\.com\\/[^\\"]*${skuLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\"]*)\\"`,
    'i'
  );
  const m = first.html.match(linkRegex);
  if (!m) return { url: first.url, html: null, status: 404 };

  return fetchHtml(m[1]);
}

function extractFullImages(html) {
  const out = new Set();
  let m;
  while ((m = FULL_REGEX.exec(html)) !== null) {
    out.add(decodeJsonString(m[1]));
  }
  return Array.from(out);
}

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('sku, slug, images, category')
    .order('sku', { ascending: true });
  if (error || !products) throw error;

  console.log(`→ Processing ${products.length} products from Supabase…\n`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  const failures = [];

  for (const p of products) {
    process.stdout.write(`  ${p.sku.padEnd(12)} `);
    try {
      const { url, html, status } = await fetchProductPage(p.sku);
      if (!html || status !== 200) {
        console.log(`✗ search returned ${status}`);
        failed++;
        failures.push({ sku: p.sku, reason: `HTTP ${status}` });
        await pause(PAUSE_MS);
        continue;
      }
      const images = extractFullImages(html);
      if (images.length === 0) {
        console.log('✗ no gallery images parsed');
        failed++;
        failures.push({ sku: p.sku, reason: 'no images parsed' });
        await pause(PAUSE_MS);
        continue;
      }

      // Only update if the array actually grew
      const existing = Array.isArray(p.images) ? p.images : [];
      if (existing.length === images.length && existing.every((e, i) => e === images[i])) {
        console.log(`= ${images.length} images (unchanged)`);
        unchanged++;
      } else {
        const { error: upErr } = await supabase
          .from('products')
          .update({ images })
          .eq('sku', p.sku);
        if (upErr) {
          console.log(`✗ DB write failed: ${upErr.message}`);
          failed++;
          failures.push({ sku: p.sku, reason: upErr.message });
        } else {
          console.log(`✓ ${images.length} images (${url ? new URL(url).pathname : ''})`);
          updated++;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`✗ ${msg}`);
      failed++;
      failures.push({ sku: p.sku, reason: msg });
    }
    await pause(PAUSE_MS);
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✓ Updated:   ${updated}`);
  console.log(`= Unchanged: ${unchanged}`);
  console.log(`✗ Failed:    ${failed}`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  ${f.sku.padEnd(12)} → ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
