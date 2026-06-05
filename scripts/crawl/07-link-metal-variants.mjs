/**
 * Stage 7 — link metal variants so the product page's metal swatches swap
 * photos (matching danhov.com behaviour).
 *
 * danhov sells each metal of a design as its own product page (…-14w, …-14y,
 * …-18k-rose, …-pt). We mirrored them 1:1, so every product row currently has
 * metals=[] and a single metal's photos — meaning no swatches render and
 * nothing can swap.
 *
 * This script groups the rows by BASE sku (the sku minus its trailing metal
 * token) and, for every variant in a group, writes:
 *   • default_metal  → this variant's own metal slug (the photos it carries)
 *   • metals         → every metal slug present in the group (drives swatches)
 *   • metal_images   → { metalSlug: [that sibling's images] } for all siblings
 *
 * ProductGalleryMetal already swaps to metal_images[selectedMetal] when a
 * swatch is clicked, so this is all the data layer needs. Non-destructive:
 * each variant keeps its own slug/row (danhov's structure preserved); we only
 * enrich the metal fields.
 *
 * Run:  node scripts/crawl/07-link-metal-variants.mjs            (dry run)
 *       node scripts/crawl/07-link-metal-variants.mjs --commit   (writes DB)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { writeState } from './lib.mjs';

config({ path: '.env.local' });
const COMMIT = process.argv.includes('--commit');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

/**
 * Parse a SKU's trailing metal token → { base, metal }.
 *
 * Returns metal === null (and base === full sku) when no metal token is
 * found, so such rows are treated as standalone (their own group of one).
 *
 * The swatch CSS only styles these slugs, so we normalise to exactly:
 *   14k_yellow 14k_white 14k_rose 18k_yellow 18k_white 18k_rose platinum
 */
function parseMetal(skuRaw) {
  const sku = String(skuRaw).toLowerCase();
  const COLOR = { w: 'white', y: 'yellow', r: 'rose', white: 'white', yellow: 'yellow', rose: 'rose' };

  // Ordered patterns, most specific first. Each captures the karat and colour
  // (or platinum) and the index where the metal token starts, so we can slice
  // the base off cleanly.
  const tries = [
    // -14k-rose / -18k-yellow / -14k-white   (verbose karat-colour)
    { re: /-(14|18)k-(white|yellow|rose)$/, metal: (m) => `${m[1]}k_${COLOR[m[2]]}` },
    // -14kw / -18ky / -14kr                  (karat + k + letter)
    { re: /-(14|18)k([wyr])$/, metal: (m) => `${m[1]}k_${COLOR[m[2]]}` },
    // -14w / -18y / -14r                     (karat + letter, the common form)
    { re: /-(14|18)([wyr])$/, metal: (m) => `${m[1]}k_${COLOR[m[2]]}` },
    // -platinum / -plat / -pt / -pl          (platinum, various spellings)
    { re: /-(platinum|plat|pt|pl)$/, metal: () => 'platinum' },
    // trailing "-white-gold" etc. with no karat → assume 14k (danhov default)
    { re: /-(white|yellow|rose)-gold$/, metal: (m) => `14k_${COLOR[m[1]]}` },
  ];

  for (const t of tries) {
    const m = sku.match(t.re);
    if (m) {
      return { base: sku.slice(0, m.index), metal: t.metal(m) };
    }
  }
  return { base: sku, metal: null };
}

async function main() {
  // Pull every active product (the mirrored catalog).
  const { data: rows, error } = await sb
    .from('products')
    .select('sku, slug, images, metals, default_metal, metal_images')
    .eq('is_active', true);
  if (error) throw error;

  // Group variants by their base sku.
  const groups = new Map(); // base → [{ sku, metal, images }]
  for (const r of rows) {
    const { base, metal } = parseMetal(r.sku);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ sku: r.sku, metal, images: r.images || [] });
  }

  // Build the per-row updates.
  const updates = [];
  let multiVariant = 0; // groups with >1 metal
  let metalParsed = 0;  // rows where we found a metal token
  for (const [, variants] of groups) {
    // Distinct metal slugs present in this group (skip nulls), stable order.
    const METAL_ORDER = ['14k_yellow', '14k_white', '14k_rose', '18k_yellow', '18k_white', '18k_rose', 'platinum'];
    const present = [...new Set(variants.map((v) => v.metal).filter(Boolean))]
      .sort((a, b) => METAL_ORDER.indexOf(a) - METAL_ORDER.indexOf(b));

    // metal_images map shared by the whole group: each metal → its photos.
    const metalImages = {};
    for (const v of variants) {
      if (v.metal && v.images.length) metalImages[v.metal] = v.images;
    }

    if (present.length > 1) multiVariant++;

    for (const v of variants) {
      if (v.metal) metalParsed++;
      updates.push({
        sku: v.sku,
        // This variant's own metal is the one its hero photos show.
        default_metal: v.metal,
        // Show a swatch for every metal available in the group. If the SKU
        // had no parseable metal, leave metals empty (no swatches).
        metals: present,
        // The shared gallery map drives the photo swap on swatch click.
        metal_images: Object.keys(metalImages).length ? metalImages : null,
      });
    }
  }

  // Snapshot for inspection.
  writeState('metal-variant-updates.json', updates);

  console.log(`${COMMIT ? '⚙  COMMIT' : '🔍 DRY RUN'} — ${rows.length} active products`);
  console.log(`    base groups:          ${groups.size}`);
  console.log(`    multi-metal groups:   ${multiVariant}`);
  console.log(`    rows with metal token:${metalParsed}`);
  console.log(`    rows without metal:   ${rows.length - metalParsed}`);
  // Show a representative multi-variant group.
  const sample = [...groups.entries()].find(([, v]) => v.filter((x) => x.metal).length > 1);
  if (sample) {
    console.log(`\n  sample group "${sample[0]}":`);
    for (const v of sample[1]) console.log(`    ${v.sku.padEnd(22)} ${v.metal ?? '(no metal)'} · ${v.images.length} imgs`);
  }

  if (!COMMIT) {
    console.log('\n→ wrote data/crawl/metal-variant-updates.json. Re-run with --commit to write.');
    return;
  }

  // Apply updates one sku at a time, batched by Promise pool for speed.
  let done = 0;
  const BATCH = 40;
  for (let i = 0; i < updates.length; i += BATCH) {
    const slice = updates.slice(i, i + BATCH);
    await Promise.all(
      slice.map((u) =>
        sb.from('products')
          .update({ default_metal: u.default_metal, metals: u.metals, metal_images: u.metal_images })
          .eq('sku', u.sku),
      ),
    );
    done += slice.length;
    process.stdout.write(`  ✓ updated ${done}/${updates.length}\n`);
  }
  console.log('\n✓ metal variants linked.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
