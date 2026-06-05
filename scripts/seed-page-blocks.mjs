/**
 * Seed default page-block content so the admin sees the page copy
 * already on the live site, ready to edit / re-order / extend.
 *
 *   npm run seed:blocks
 *
 * Idempotent — wipes existing rows per page_slug before inserting,
 * so you can re-run after editing the source-of-truth below.
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

const PAGES = {
  home: [
    { type: 'heading', data: { eyebrow: 'The Philosophy of Oneness', text: 'The same force that shapes galaxies, shapes love.', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: "From the arms of the Milky Way to the vortex of water in a cup — the spiral is the universe's oldest signature. DANHOV rings carry this truth in every curve, every setting, every stone.", align: 'center' } },
    { type: 'spacer', data: { size: 'md' } },
    { type: 'quote', data: { text: 'We are already whole.', attribution: 'You are not looking for your other half. Love is two whole people choosing each other.' } },
    { type: 'quote', data: { text: 'Waves are the ocean.', attribution: 'You are not separate from life — you are life expressing itself.' } },
    { type: 'quote', data: { text: 'The way out is to go in.', attribution: 'Every answer lives inside. In silence, the ring was formed.' } },
    { type: 'quote', data: { text: 'Self love.', attribution: 'The most radical, complete act. The ring you give yourself is as sacred as any given to you.' } },
    { type: 'quote', data: { text: 'You are the universe.', attribution: 'The same force that shaped galaxies, shaped you.' } },
    { type: 'spacer', data: { size: 'lg' } },
    { type: 'heading', data: { eyebrow: 'A New Collection', text: 'The Self Love Ring', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: 'You do not need to wait. You do not need permission. The most powerful ring you will ever wear is the one you give yourself — a promise, a declaration, a homecoming.', align: 'center' } },
    { type: 'cta', data: { label: 'Explore Self-Love Rings', href: '/fine-jewelry', style: 'primary' } },
    { type: 'divider', data: {} },
    { type: 'quote', data: { text: 'Presence is a present.', attribution: 'Which can only be used by being present. — Jack Hovsepian' } },
  ],
  'engagement-rings': [
    { type: 'heading', data: { eyebrow: 'Crafted in Los Angeles · Made to Order', text: 'Engagement rings are not products. They are vows you can wear.', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: 'Every Abbraccio embraces its stone in a flowing twist of metal. Every Voltaggio holds its diamond in held tension. Every Per Lei whispers in feminine lines. Whichever speaks to you — yours will be made by master jewelers, by hand, in Los Angeles.', align: 'center' } },
    { type: 'cta', data: { label: 'Book a private consultation', href: '/#appointment', style: 'primary' } },
  ],
  'wedding-bands': [
    { type: 'heading', data: { eyebrow: 'His & Hers · Made to Order', text: 'A band is the simplest promise — and the longest one.', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: 'Every DANHOV band is hand-finished in 14k or 18k gold. Brushed or polished, hammered or smooth, woven or solid. Pick yours — or commission a pair that pairs.', align: 'center' } },
  ],
  'fine-jewelry': [
    { type: 'heading', data: { eyebrow: 'Pendants · Earrings · Bracelets', text: 'Every piece is a sacred story.', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: 'Beyond engagement and wedding, DANHOV fine jewelry carries the same hand and the same gold. Worn alone or stacked — to mark a memory or to start one.', align: 'center' } },
  ],
  mens: [
    { type: 'heading', data: { eyebrow: 'For Him · Made to Order', text: 'Strength. Refined.', level: 2, align: 'center' } },
    { type: 'paragraph', data: { text: "Signet rings, link bracelets, modern crucifixes — designed for the man who understands that true strength is quiet, and true luxury endures.", align: 'center' } },
  ],
  faq: [
    { type: 'heading', data: { eyebrow: 'A quiet conversation', text: 'Questions, answered.', level: 1, align: 'center' } },
    { type: 'paragraph', data: { text: 'Everything you might wonder before commissioning a DANHOV piece — metals, sizing, timing, warranty, and the way we work. If we missed something, write us at care@danhov.com.', align: 'center' } },
  ],
};

console.log('→ Seeding page_blocks for', Object.keys(PAGES).length, 'pages');

let inserted = 0;
for (const [slug, blocks] of Object.entries(PAGES)) {
  // Clear + re-insert is the simplest idempotent approach
  const { error: delErr } = await supabase.from('page_blocks').delete().eq('page_slug', slug);
  if (delErr) {
    console.error(`  ${slug.padEnd(20)} ✗ clear failed: ${delErr.message}`);
    continue;
  }
  const rows = blocks.map((b, i) => ({
    page_slug: slug,
    position: i,
    type: b.type,
    data: b.data,
    is_visible: true,
  }));
  const { error: insErr } = await supabase.from('page_blocks').insert(rows);
  if (insErr) {
    console.error(`  ${slug.padEnd(20)} ✗ insert failed: ${insErr.message}`);
    continue;
  }
  console.log(`  ${slug.padEnd(20)} ✓ ${rows.length} blocks`);
  inserted += rows.length;
}

console.log(`\n✓ Seeded ${inserted} blocks total. Admin can now edit them at /admin/content.`);
