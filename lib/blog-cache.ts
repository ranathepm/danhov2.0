/**
 * Blog content cache backed by Supabase.
 *
 * Requires a table in your Supabase project:
 *
 *   CREATE TABLE IF NOT EXISTS blog_cache (
 *     slug       TEXT PRIMARY KEY,
 *     content    TEXT NOT NULL,
 *     fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 *
 * The table keeps a copy of each post's scraped HTML so the detail page
 * renders even if danhov.com is unreachable.
 */

import { supabaseAnon } from '@/lib/supabase/anon';

const STALE_DAYS = 7;

export async function getCachedBlogContent(slug: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAnon
      .from('blog_cache')
      .select('content, fetched_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;

    // Return cached content regardless of age — freshness is handled during
    // background revalidation. If the content exists, always serve it.
    return (data.content as string) || null;
  } catch {
    return null;
  }
}

export async function setCachedBlogContent(slug: string, content: string): Promise<void> {
  try {
    await supabaseAnon
      .from('blog_cache')
      .upsert({ slug, content, fetched_at: new Date().toISOString() }, { onConflict: 'slug' });
  } catch {
    // Best-effort — never block the response on cache write failure
  }
}

export async function isCacheStale(slug: string): Promise<boolean> {
  try {
    const { data } = await supabaseAnon
      .from('blog_cache')
      .select('fetched_at')
      .eq('slug', slug)
      .maybeSingle();

    if (!data?.fetched_at) return true;
    const age = Date.now() - new Date(data.fetched_at as string).getTime();
    return age > STALE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}
