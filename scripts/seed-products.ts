import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
// Node 20 needs an explicit ws transport for @supabase/realtime-js
import ws from 'ws';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

type LegacyProduct = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  metals: string | null;
  price: string | null;
  image: string | null;
  category: 'engagement' | 'wedding' | 'fine' | 'mens';
  col?: string | null;
  metal_tokens?: string[];
  sub?: string[];
};

function parseMetals(metalsString: string | null): string[] {
  if (!metalsString) return [];
  return metalsString
    .split(/[·•]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

async function main() {
  const client = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });

  const jsonPath = resolve(process.cwd(), 'data/products.json');
  const raw = await readFile(jsonPath, 'utf8');
  const products: LegacyProduct[] = JSON.parse(raw);

  console.log(`→ Loaded ${products.length} entries from data/products.json`);

  // Some SKUs appear in multiple categories (e.g. unisex bands listed under
  // both wedding-bands and men's). Group by SKU and merge categories[].
  type Row = {
    sku: string;
    slug: string;
    name: string;
    collection: string | null;
    category: string;            // primary (first seen)
    categories: string[];        // every listing this product appears on
    metals: string[];
    images: string[];
    price_display: string | null;
    sub_categories: string[];
    is_active: boolean;
  };

  const grouped = new Map<string, Row>();
  for (const p of products) {
    const existing = grouped.get(p.sku);
    if (existing) {
      if (!existing.categories.includes(p.category)) existing.categories.push(p.category);
      // merge sub-categories
      for (const s of p.sub ?? []) {
        if (!existing.sub_categories.includes(s)) existing.sub_categories.push(s);
      }
      // if we hadn't found an image yet but this one has it, keep it
      if (existing.images.length === 0 && p.image) existing.images.push(p.image);
    } else {
      grouped.set(p.sku, {
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        collection: p.collection || p.col || null,
        category: p.category,
        categories: [p.category],
        metals: parseMetals(p.metals),
        images: p.image ? [p.image] : [],
        price_display: p.price ?? null,
        sub_categories: [...(p.sub ?? [])],
        is_active: true,
      });
    }
  }

  const rows = Array.from(grouped.values());
  console.log(`→ Deduplicated to ${rows.length} unique SKUs`);

  // Upsert in batches by sku (unique key)
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error, count } = await client
      .from('products')
      .upsert(slice, { onConflict: 'sku', count: 'exact' });
    if (error) {
      console.error(`✗ Batch ${i / BATCH + 1} failed:`, error.message);
      process.exit(1);
    }
    inserted += slice.length;
    console.log(`  ✓ Batch ${i / BATCH + 1}: upserted ${slice.length} (cumulative: ${inserted})`);
  }

  // Verify by counting rows whose categories[] array contains each label
  const { data: allRows, error: countErr } = await client
    .from('products')
    .select('sku, categories');

  if (!countErr && allRows) {
    const tally: Record<string, number> = {};
    for (const r of allRows as Array<{ sku: string; categories: string[] | null }>) {
      for (const c of r.categories ?? []) tally[c] = (tally[c] ?? 0) + 1;
    }
    console.log('\n→ Listings per category (a product can appear in multiple):');
    Object.entries(tally).forEach(([cat, n]) => console.log(`  ${cat.padEnd(12)} ${n}`));
    console.log(`  ${'TOTAL ROWS'.padEnd(12)} ${allRows.length}`);
  }

  console.log(`\n✓ Seed complete — ${inserted} products in Supabase`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
