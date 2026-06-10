import Link from 'next/link';
import Image from 'next/image';
import { supabaseAnon } from '@/lib/supabase/anon';
import { stripMetalSuffix } from '@/lib/product-display';

async function getSwirlRing(): Promise<{ slug: string | null; image: string | null; name: string | null }> {
  try {
    // Pinned to AE520UQ-18w — Abbraccio Swirl Diamond Ring in 18k White Gold
    const { data } = await supabaseAnon
      .from('products')
      .select('slug, name, images')
      .ilike('sku', 'ae520uq-18w')
      .eq('is_active', true)
      .maybeSingle();
    if (data && Array.isArray(data.images) && data.images.length > 0) {
      return { slug: data.slug ?? null, image: data.images[0], name: data.name ?? null };
    }
    // Fallback: name search
    const { data: fallback } = await supabaseAnon
      .from('products')
      .select('slug, name, images')
      .or('name.ilike.%swirl%,name.ilike.%love ring%')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    return {
      slug: fallback?.slug ?? null,
      image: Array.isArray(fallback?.images) && fallback.images.length > 0 ? fallback.images[0] : null,
      name: fallback?.name ?? null,
    };
  } catch {
    return { slug: null, image: null, name: null };
  }
}

export default async function SignatureSection() {
  const { slug, image, name } = await getSwirlRing();
  const href = slug ? `/product/${slug}` : '/engagement-rings';
  const displayTitle = name ? stripMetalSuffix(name) : 'The Swirl Love Ring';

  return (
    <section className="sig-section">
      <div className="sig-inner">
        <Link href={href} className="sig-img-wrap" aria-label={`View ${displayTitle}`}>
          {image ? (
            <Image
              src={image}
              alt={`${displayTitle} — DANHOV Signature`}
              fill
              sizes="(max-width: 880px) 100vw, 50vw"
              style={{ objectFit: 'contain', padding: '32px', mixBlendMode: 'multiply' }}
            />
          ) : (
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="sig-ring-svg">
              <circle cx="120" cy="130" r="78" stroke="#8b2a2a" strokeWidth="1" opacity="0.3" fill="none" />
              <circle cx="120" cy="120" r="68" stroke="#AC3438" strokeWidth="14" fill="none" />
              <circle cx="120" cy="120" r="68" stroke="#8B2A2D" strokeWidth="0.5" fill="none" opacity="0.6" />
              <path d="M52 120 Q120 60 188 120" stroke="#8B2A2D" strokeWidth="0.5" fill="none" opacity="0.4" />
              <circle cx="120" cy="84" r="9" fill="#fffaf3" stroke="#AC3438" strokeWidth="0.5" />
            </svg>
          )}
        </Link>

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
