import Image from 'next/image';
import Link from 'next/link';
import { supabaseAnon } from '@/lib/supabase/anon';

async function getSwirlRing(): Promise<{ slug: string; image: string } | null> {
  try {
    const { data } = await supabaseAnon
      .from('products')
      .select('slug, images')
      .or('name.ilike.%swirl%,name.ilike.%love ring%')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (data?.images?.[0]) return { slug: data.slug, image: data.images[0] };
  } catch { /* fall through to static fallback */ }
  return null;
}

export default async function SignatureSection() {
  const ring = await getSwirlRing();
  const imageSrc = ring?.image ?? '/triad-galaxy.png';
  const href = ring ? `/product/${ring.slug}` : '/engagement-rings';

  return (
    <section className="sig-section">
      <div className="sig-inner">
        <Link href={href} className="sig-img-wrap" aria-label="View The Swirl Love Ring">
          <Image
            src={imageSrc}
            alt="The Swirl Love Ring — DANHOV"
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 880px) 90vw, 45vw"
          />
        </Link>

        <div className="sig-text">
          <span className="sig-eyebrow">The Signature Ring</span>
          <h2 className="sig-title">The <em>Swirl Love</em> Ring</h2>
          <div className="sig-rule" />
          <p className="sig-body">
            &ldquo;In silence, the universe revealed its shape. A spiral with no beginning,
            no end. Two becoming one without losing themselves.
            The ring was not designed &mdash; it was received.&rdquo;
          </p>
          <Link href={href} className="btn-solid" style={{ marginLeft: 0 }}>
            See the Ring
          </Link>
        </div>
      </div>
    </section>
  );
}
