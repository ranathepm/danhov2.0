import Link from 'next/link';
import Image from 'next/image';
import { supabaseAnon } from '@/lib/supabase/anon';

async function getSwirlRing(): Promise<{ slug: string | null; image: string | null }> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('slug, images')
      .or('name.ilike.%swirl%,name.ilike.%love ring%')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    return {
      slug: data?.slug ?? null,
      image: Array.isArray(data?.images) && data.images.length > 0 ? data.images[0] : null,
    };
  } catch {
    return { slug: null, image: null };
  }
}

export default async function SignatureSection() {
  const { slug, image } = await getSwirlRing();
  const href = slug ? `/product/${slug}` : '/engagement-rings';

  return (
    <section className="sig-section">
      <div className="sig-inner">
        <Link href={href} className="sig-img-wrap" aria-label="View The Swirl Love Ring">
          {image ? (
            <Image
              src={image}
              alt="The Swirl Love Ring — DANHOV Signature"
              fill
              sizes="(max-width: 880px) 100vw, 50vw"
              style={{ objectFit: 'contain', padding: '32px', mixBlendMode: 'multiply' }}
            />
          ) : (
            <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="sig-ring-svg">
              <circle cx="120" cy="130" r="78" stroke="#8b2a2a" strokeWidth="1" opacity="0.3" fill="none" />
              <circle cx="120" cy="120" r="68" stroke="#b8923a" strokeWidth="14" fill="none" />
              <circle cx="120" cy="120" r="68" stroke="#d4b260" strokeWidth="0.5" fill="none" opacity="0.6" />
              <path d="M52 120 Q120 60 188 120" stroke="#d4b260" strokeWidth="0.5" fill="none" opacity="0.4" />
              <circle cx="120" cy="84" r="9" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.5" />
            </svg>
          )}
        </Link>

        <div className="sig-text">
          <span className="sig-eyebrow">The Signature</span>
          <h2 className="sig-title">The Swirl Love Ring</h2>
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
