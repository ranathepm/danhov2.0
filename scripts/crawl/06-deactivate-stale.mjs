/**
 * Stage 6 — deactivate any product NOT in the crawled catalog.
 *
 * "Replace all" couldn't hard-delete the original seed rows because some are
 * referenced by quote_locks (FK). Instead we set is_active=false on every row
 * whose sku isn't in the new catalog — the storefront filters is_active=true,
 * so they disappear from all listings/detail pages while preserving FK history.
 *
 * Run:  node scripts/crawl/06-deactivate-stale.mjs --commit
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { readState } from './lib.mjs';

config({ path: '.env.local' });
const COMMIT = process.argv.includes('--commit');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }, realtime: { transport: ws },
});

const rows = readState('db-rows.json', []);
const keep = new Set(rows.map((r) => r.sku));

const { data: all, error } = await sb.from('products').select('sku, is_active');
if (error) throw error;
const stale = (all || []).filter((r) => !keep.has(r.sku));
console.log(`catalog skus: ${keep.size} | db rows: ${all.length} | stale (to deactivate): ${stale.length}`);
console.log('  sample stale:', stale.slice(0, 5).map((r) => r.sku).join(', '));

if (!COMMIT) {
  console.log('\n🔍 dry run — re-run with --commit to deactivate.');
  process.exit(0);
}

const staleSkus = stale.map((r) => r.sku);
let done = 0;
const B = 200;
for (let i = 0; i < staleSkus.length; i += B) {
  const slice = staleSkus.slice(i, i + B);
  const { error: e } = await sb.from('products').update({ is_active: false }).in('sku', slice);
  if (e) { console.error('✗', e.message); process.exit(1); }
  done += slice.length;
}
const { count: active } = await sb.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
console.log(`✓ deactivated ${done} stale rows. active products now: ${active}`);
process.exit(0);
