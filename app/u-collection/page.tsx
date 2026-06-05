import type { Metadata } from 'next';
import Link from 'next/link';
import { buildBreadcrumb, jsonLdScript } from '@/lib/seo';
import PageBlocks from '@/components/PageBlocks';

export const metadata: Metadata = {
  title: 'The U Collection · DANHOV',
  description:
    'For years we have made rings shaped like the letter U. We never told anyone why. Now we will. The U Collection — held space, you, union. Handcrafted in Los Angeles in 14k or 18k gold.',
  alternates: { canonical: '/u-collection' },
};

export const dynamic = 'force-dynamic';

export default function UCollectionPage() {
  const breadcrumb = buildBreadcrumb([
    { name: 'Home', url: '/' },
    { name: 'The U Collection', url: '/u-collection' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
      />

      <main className="ucoll-page">
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="bc-sep">/</span>
          <span>The U Collection</span>
        </nav>

        {/* Part 1: Hero intro */}
        <section className="ucoll-hero">
          <span className="ucoll-eyebrow">DANHOV — THE U COLLECTION</span>
          <div className="ucoll-big-u" aria-hidden="true">U</div>
          <p className="ucoll-hero-line">
            For years we have made rings shaped like the letter <em>U.</em>
          </p>
          <p className="ucoll-hero-sub">We never told anyone why. Now we will.</p>
        </section>

        {/* Part 2: The meaning, revealed */}
        <section className="ucoll-meaning">
          <span className="ucoll-eyebrow">THE MEANING, REVEALED</span>
          <h2 className="ucoll-meaning-title">U is for you.</h2>
          <p className="ucoll-meaning-body">
            U is the held space. U is what receives. U is the shape of a vessel,
            <br />
            open at the top, waiting to be filled with light.
          </p>
          <p className="ucoll-meaning-body ucoll-meaning-body--gap">
            And when two people exchange these rings, the silent truth between them
            <br />
            is the oldest one there is —
          </p>
          <div className="ucoll-meaning-reveal">I am you.</div>
          <div className="ucoll-meaning-divider" />
        </section>

        {/* Part 3: Three pillars */}
        <section className="ucoll-pillars">
          <div className="ucoll-pillar">
            <div className="ucoll-pillar-u" aria-hidden="true">U</div>
            <div className="ucoll-pillar-label">Held Space</div>
            <div className="ucoll-pillar-quote">&ldquo;The vessel is what receives.&rdquo;</div>
            <p className="ucoll-pillar-body">
              The U is not closed. It is open. Ready. Listening. A held space
              waiting for what comes — love, light, the moment.
            </p>
          </div>
          <div className="ucoll-pillar">
            <div className="ucoll-pillar-u" aria-hidden="true">U</div>
            <div className="ucoll-pillar-label">You</div>
            <div className="ucoll-pillar-quote">
              &ldquo;The ring is shaped like the one who wears it.&rdquo;
            </div>
            <p className="ucoll-pillar-body">
              Every U ring is custom in this way — whoever wears it, it is shaped
              for them. You are the meaning. Without you, the U is just a letter.
            </p>
          </div>
          <div className="ucoll-pillar">
            <div className="ucoll-pillar-u" aria-hidden="true">U</div>
            <div className="ucoll-pillar-label">Union</div>
            <div className="ucoll-pillar-quote">&ldquo;I am you.&rdquo;</div>
            <p className="ucoll-pillar-body">
              Two rings exchanged. Two Us, mirroring each other. The deepest vow
              underneath every wedding ring ever given — now spoken aloud.
            </p>
          </div>
        </section>

        {/* CTA — book a private consultation for a U commission */}
        <section className="ucoll-cta">
          <h3 className="ucoll-cta-title">Commission a U ring</h3>
          <p className="ucoll-cta-body">
            Every U piece is made to order in our Los Angeles atelier, in 14k or
            18k gold, sized and engraved for the person who will wear it.
            A private consultation begins the conversation.
          </p>
          <div className="ucoll-cta-actions">
            <Link href="/#appointment" className="btn-primary">
              Book a Private Consultation
            </Link>
            <Link href="/ring-builder" className="btn-solid">
              Begin a Bespoke Ring
            </Link>
          </div>
        </section>

        {/* Admin-managed blocks */}
        <PageBlocks pageSlug="u-collection" />
      </main>
    </>
  );
}
