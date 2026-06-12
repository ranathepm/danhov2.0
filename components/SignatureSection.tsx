import Link from 'next/link';
import { supabaseAnon } from '@/lib/supabase/anon';
import { stripMetalSuffix } from '@/lib/product-display';
import SignatureImageClient from './SignatureImageClient';

async function getSwirlRing(): Promise<{ slug: string | null; images: string[]; name: string | null }> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('slug, name, images')
      .ilike('sku', 'ae520uq-18w')
      .eq('is_active', true)
      .maybeSingle();
    if (data && Array.isArray(data.images) && data.images.length > 0) {
      return { slug: data.slug ?? null, images: data.images as string[], name: data.name ?? null };
    }
    const { data: fallback } = await supabaseAnon
      .from('products')
      .select('slug, name, images')
      .or('name.ilike.%swirl%,name.ilike.%love ring%')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    return {
      slug: fallback?.slug ?? null,
      images: Array.isArray(fallback?.images) ? (fallback.images as string[]) : [],
      name: fallback?.name ?? null,
    };
  } catch {
    return { slug: null, images: [], name: null };
  }
}

export default async function SignatureSection() {
  const { slug, images, name } = await getSwirlRing();
  const href = slug ? `/product/${slug}` : '/engagement-rings';
  const displayTitle = name ? stripMetalSuffix(name) : 'The Swirl Love Ring';

  return (
    <section className="sig-section">
      <div className="sig-inner">
        <SignatureImageClient images={images} href={href} alt={displayTitle} />

        <div className="sig-text">
          <span className="sig-eyebrow">The Signature</span>
          <h2 className="sig-title">{displayTitle}</h2>
          <div className="sig-rule" />
          <p className="sig-body">
            &ldquo;In silence, the universe revealed its shape. A spiral with no beginning,
            no end. Two becoming one without losing themselves.
            The ring was not designed &mdash; it was received.&rdquo;
          </p>
          <Link href={href} className="sig-cta">
            See the Ring
          </Link>
        </div>
      </div>
    </section>
  );
}
