import { createClient } from '@supabase/supabase-js';

/**
 * Lightweight server-side Supabase client using the publishable key.
 * Use this in Server Components for SELECT-only reads (RLS enforces it).
 *
 * For mutations or auth-sensitive reads, use `lib/supabase/server.ts`
 * (cookies-aware) or `createServiceClient()` (service role).
 */
export const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } }
);
