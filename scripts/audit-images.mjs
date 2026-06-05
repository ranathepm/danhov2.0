import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });
const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

const { data } = await c.from('products').select('sku, slug, category, images').order('sku');
let totalImages = 0;
let multiImage = 0;
let singleImage = 0;
let zeroImage = 0;
const failed = [];

for (const p of data) {
  const n = Array.isArray(p.images) ? p.images.length : 0;
  totalImages += n;
  if (n === 0) { zeroImage++; failed.push(p.sku); }
  else if (n === 1) singleImage++;
  else multiImage++;
}

console.log(`Total products:           ${data.length}`);
console.log(`With multiple images:     ${multiImage}`);
console.log(`With single image:        ${singleImage}`);
console.log(`With zero images:         ${zeroImage}`);
console.log(`Sum of all images stored: ${totalImages}`);
console.log('\nSample (first multi-image product):');
const sample = data.find(p => Array.isArray(p.images) && p.images.length > 1);
if (sample) {
  console.log(`  ${sample.sku} (${sample.images.length} images):`);
  for (const url of sample.images) console.log(`    ${url}`);
}
if (failed.length) {
  console.log(`\nFailed SKUs (${failed.length}):`);
  console.log('  ' + failed.join(', '));
}
