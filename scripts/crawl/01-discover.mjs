/**
 * Stage 1 — discover every product-page URL across the whole catalog.
 *
 * Walks each category in CATEGORY_TREE, paginating ?p=1,2,3… until a page
 * yields no new product links. Dedupes by URL (a product can appear under
 * the section sweep AND a collection page — we keep the most specific
 * collection that found it). Writes data/crawl/products.manifest.json.
 *
 * Run:  node scripts/crawl/01-discover.mjs
 */

import { BASE, CATEGORY_TREE, fetchText, sleep, writeState, readState } from './lib.mjs';

const PER_PAGE_DELAY_MS = 200;
const MAX_PAGES = 60; // safety cap per category

// <a class="product-item-link"\n  href="https://www.danhov.com/...">
const LINK_RE = /class="product-item-link"\s*href="(https:\/\/www\.danhov\.com\/[^"]+)"/g;

function extractProductUrls(html) {
  const out = [];
  let m;
  while ((m = LINK_RE.exec(html)) !== null) {
    out.push(m[1].replace(/&amp;/g, '&').split('?')[0].split('#')[0]);
  }
  return out;
}

function slugFromUrl(url) {
  return url.replace(BASE + '/', '').replace(/\/$/, '');
}

async function crawlCategory(cat, manifest) {
  let added = 0;
  for (let p = 1; p <= MAX_PAGES; p++) {
    const url = `${BASE}/${cat.path}${p === 1 ? '' : `?p=${p}`}`;
    const { ok, html } = await fetchText(url);
    if (!ok || !html) break;
    const urls = extractProductUrls(html);
    if (urls.length === 0) break;

    let newOnPage = 0;
    for (const u of urls) {
      const existing = manifest[u];
      if (!existing) {
        manifest[u] = {
          url: u,
          slug: slugFromUrl(u),
          category: cat.category,
          section: cat.section,
          collection: cat.collection,
        };
        added++;
        newOnPage++;
      } else if (!existing.collection && cat.collection) {
        // Prefer a specific collection over the section-wide sweep
        existing.collection = cat.collection;
      }
    }
    // Last page: Magento clamps ?p beyond the end back to the last page,
    // so if nothing new showed up, we're done.
    if (newOnPage === 0) break;
    await sleep(PER_PAGE_DELAY_MS);
  }
  return added;
}

async function main() {
  const manifest = readState('products.manifest.json', {});
  console.log(`→ discovering products across ${CATEGORY_TREE.length} category pages\n`);

  for (const cat of CATEGORY_TREE) {
    const before = Object.keys(manifest).length;
    const added = await crawlCategory(cat, manifest);
    const label = `${cat.section}/${cat.collection ?? '(all)'}`;
    console.log(`  ${label.padEnd(36)} +${added} new  (total ${Object.keys(manifest).length})`);
    writeState('products.manifest.json', manifest); // checkpoint after each category
  }

  const all = Object.values(manifest);
  const byCat = {};
  for (const p of all) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`\n✓ ${all.length} unique product pages`);
  for (const [c, n] of Object.entries(byCat)) console.log(`    ${c.padEnd(12)} ${n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
