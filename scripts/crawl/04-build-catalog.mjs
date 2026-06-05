/**
 * Stage 4a — assemble the final product catalog (non-destructive).
 *
 * Joins galleries.json (metadata + danhov image URLs) with uploads.json
 * (danhov URL → Supabase Storage public URL) into data/crawl/catalog.json:
 * one row per danhov product page, images rewritten to our own storage URLs.
 *
 * This does NOT touch the database — review catalog.json, then run
 * 05-upsert-db.mjs to write it.
 *
 * Run:  node scripts/crawl/04-build-catalog.mjs
 */

import { readState, writeState } from './lib.mjs';

function priceDisplay(price) {
  if (!price || Number.isNaN(price)) return null;
  return '$' + Number(price).toLocaleString('en-US');
}

function main() {
  const galleries = readState('galleries.json', {});
  const uploads = readState('uploads.json', {});

  const rows = [];
  let mappedImgs = 0;
  let unmappedImgs = 0;
  let noImageProducts = 0;

  for (const p of Object.values(galleries)) {
    const danhovImgs = p.images || [];
    const storageImgs = [];
    for (const u of danhovImgs) {
      const up = uploads[u];
      if (up?.publicUrl) {
        storageImgs.push(up.publicUrl);
        mappedImgs++;
      } else {
        unmappedImgs++;
      }
    }
    if (storageImgs.length === 0) noImageProducts++;

    rows.push({
      sku: p.sku || p.slug,
      slug: p.slug,
      name: p.name || p.sku || p.slug,
      collection: p.collection,
      category: p.category,
      categories: [p.category],
      price_display: priceDisplay(p.price),
      description: p.description || null,
      images: storageImgs,
      danhov_url: p.url,
      danhov_images: danhovImgs,
    });
  }

  writeState('catalog.json', rows);

  const byCat = {};
  for (const r of rows) byCat[r.category] = (byCat[r.category] || 0) + 1;

  console.log('✓ catalog.json written');
  console.log(`    products:          ${rows.length}`);
  console.log(`    images mapped:     ${mappedImgs}`);
  console.log(`    images unmapped:   ${unmappedImgs} (upload failed/pending)`);
  console.log(`    products w/o image:${noImageProducts}`);
  console.log('    by category:');
  for (const [c, n] of Object.entries(byCat)) console.log(`      ${c.padEnd(12)} ${n}`);
}

main();
