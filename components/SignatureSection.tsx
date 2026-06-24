import Link from 'next/link';
import SignatureImageClient from './SignatureImageClient';

const BASE = 'https://wirbqklbygxuafelsqql.supabase.co/storage/v1/object/public/product-images/products/AE505UQ/platinum/Danhov%20Abbraccio%20Swirl%20Diamond%20Engagement%20Ring%20AE505UQ_';

const IMAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${BASE}${n}.jpg`);

const HREF  = '/product/danhov-abbraccio-swirl-diamond-engagement-ring';
const TITLE = 'Abbraccio Swirl Diamond Engagement Ring';

export default function SignatureSection() {
  return (
    <section className="sig2-section">
      <div className="sig2-image-panel">
        <SignatureImageClient images={IMAGES} href={HREF} alt={TITLE} />
      </div>

      <div className="sig2-text-panel">
        <span className="sig2-eyebrow">The Signature Piece</span>
        <h2 className="sig2-title">{TITLE}</h2>
        <div className="sig2-rule" />
        <blockquote className="sig2-quote">
          &ldquo;In silence, the universe revealed its shape — a spiral with no beginning,
          no end. Two becoming one without losing themselves.
          The ring was not designed. It was received.&rdquo;
        </blockquote>
        <p className="sig2-attribution">— Jack Hovsepian, Founder · Los Angeles, 1984</p>
        <div className="sig2-awards">
          <span>★ Industry Award Winner</span>
          <span className="sig2-awards-sep">·</span>
          <span>Handcrafted to Order</span>
        </div>
        <Link href={HREF} className="sig2-cta">
          Discover the Ring
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
