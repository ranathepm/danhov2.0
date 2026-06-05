/**
 * Creates (or updates) the admin user.
 *
 *   ADMIN_EMAIL    — the admin's email (also used to sign in)
 *   ADMIN_PASSWORD — initial password (the admin can change it later from
 *                    the Settings page)
 *
 * Idempotent. If the auth user already exists, just resets the password
 * and reasserts the admin_users row.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!URL || !SECRET || !EMAIL || !PASSWORD) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY / ADMIN_EMAIL / ADMIN_PASSWORD');
  process.exit(1);
}

const admin = createClient(URL, SECRET, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

console.log(`→ Seeding admin user: ${EMAIL}`);

// Look up existing user
const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const existing = list?.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());

let userId;
if (existing) {
  console.log(`  ↻ User already exists (id=${existing.id}) — resetting password`);
  const { error: upErr } = await admin.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (upErr) {
    console.error('  ✗ password reset failed:', upErr.message);
    process.exit(1);
  }
  userId = existing.id;
} else {
  console.log('  + Creating new auth user');
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data?.user) {
    console.error('  ✗ create failed:', error?.message);
    process.exit(1);
  }
  userId = data.user.id;
}

const { error: upsertErr } = await admin
  .from('admin_users')
  .upsert({ user_id: userId, email: EMAIL.toLowerCase() }, { onConflict: 'user_id' });
if (upsertErr) {
  console.error('  ✗ admin_users upsert failed:', upsertErr.message);
  process.exit(1);
}

console.log('\n✓ Admin ready. Sign in at /admin/login with:');
console.log(`   email:    ${EMAIL}`);
console.log(`   password: (the ADMIN_PASSWORD you set)\n`);
