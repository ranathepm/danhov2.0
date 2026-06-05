/**
 * Scrape danhov.com for the full image gallery of every product in our DB
 * and upsert the URLs into products.images (jsonb).
 *
 * Strategy per SKU:
 *   1. GET https://www.danhov.com/catalogsearch/result/?q=<SKU>
 *      → find first product detail URL on the page
 *   2. GET that URL → regex out every media/catalog/product image that
 *      contains the SKU (case-insensitive). De-dup. Limit to ~10 to
 *      keep payloads sane.
 *   3. If we found any, update products.images. Otherwise leave alone
 *      so the existing single image stays.
 *
 * Run:  node scripts/scrape-product-images.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });

const BASE = 'https://www.danhov.com';
const CONCURRENCY = 5;
const PER_REQ_DELAY_MS = 250;

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

async function main() {
  const { data: products, error } = await client
    .from('products')
    .select('sku, slug, name, images')
    .eq('is_active', true);

  if (error) {
    console.error('Failed to read products:', error);
    process.exit(1);
  }

  console.log(`→ ${products.length} products to scan`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Simple concurrency pool
  let i = 0;
  async function worker() {
    while (i < products.length) {
      const idx = i++;
      const p = products[idx];
      try {
        const images = await scrapeForSku(p.sku);
        if (images.length === 0) {
          skipped++;
          process.stdout.write(`  • ${p.sku.padEnd(14)} no images found\n`);
          continue;
        }
        const { error: upErr } = await client
          .from('products')
          .update({ images })
          .eq('sku', p.sku);
        if (upErr) {
          failed++;
          console.error(`  ✗ ${p.sku} update:`, upErr.message);
        } else {
          updated++;
          process.stdout.write(
            `  ✓ ${p.sku.padEnd(14)} ${images.length} image${images.length === 1 ? '' : 's'}\n`
          );
        }
      } catch (e) {
        failed++;
        console.error(`  ✗ ${p.sku} error:`, e?.message || e);
      }
      await sleep(PER_REQ_DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\n✓ Done. Updated: ${updated} · Skipped: ${skipped} · Failed: ${failed}`);
}

async function scrapeForSku(sku) {
  // 1) Find product URL via the catalog search
  const productUrl = await findProductUrl(sku);
  if (!productUrl) return [];

  // 2) Fetch product page HTML
  const res = await fetch(productUrl, {
    headers: { 'User-Agent': uaString() },
  });
  if (!res.ok) return [];
  const html = await res.text();

  // 3) Extract all gallery image URLs that contain the SKU (case-insensitive)
  const re = /https:\/\/www\.danhov\.com\/media\/catalog\/product\/cache\/[a-z0-9]+\/[a-z0-9]\/[a-z0-9]\/[^"'\s<>)]+/gi;
  const matches = html.match(re) || [];
  const skuLower = sku.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Keep ones containing the SKU prefix or a normalized version
  const filtered = matches.filter((u) => {
    const lu = u.toLowerCase();
    return lu.includes(skuLower) || lu.includes(skuLower.replace('-', ''));
  });

  // Deduplicate by filename (different "cache" hashes resolve to the same image)
  const seen = new Set();
  const out = [];
  for (const url of filtered) {
    const filename = url.split('/').pop()?.toLowerCase() || url;
    if (seen.has(filename)) continue;
    seen.add(filename);
    out.push(url);
    if (out.length >= 10) break;
  }
  return out;
}

async function findProductUrl(sku) {
  // Try a few search strategies — danhov.com catalog can be picky about
  // hyphens / metal-codes / lowercase.
  const queries = [
    sku,
    sku.toLowerCase(),
    sku.split('-')[0],          // strip "-PLAT", "-PR" etc
    sku.split('-')[0].toLowerCase(),
  ];

  for (const q of Array.from(new Set(queries))) {
    const url = `${BASE}/catalogsearch/result/?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'User-Agent': uaString() } });
    if (!res.ok) continue;
    const html = await res.text();

    // Multiple selector variants — Magento themes vary
    const patterns = [
      /<a[^>]+class="[^"]*product-item-link[^"]*"[^>]+href="([^"]+)"/i,
      /<a[^>]+href="([^"]+)"[^>]+class="[^"]*product-item-link[^"]*"/i,
      /<a[^>]+class="[^"]*product-item-photo[^"]*"[^>]+href="([^"]+)"/i,
      /<a[^>]+class="[^"]*product[^"]*-link[^"]*"[^>]+href="([^"]+)"/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) {
        let productUrl = decodeHtml(m[1]);
        if (productUrl.startsWith('/')) productUrl = BASE + productUrl;
        return productUrl;
      }
    }
  }
  return null;
}

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function uaString() {
  return 'Mozilla/5.0 (compatible; DanhovImageSync/1.0; +https://danhov-web.vercel.app)';
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
