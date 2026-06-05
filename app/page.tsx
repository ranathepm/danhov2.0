import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HomepageScripts from '@/components/HomepageScripts';
import CollectionsSlider from '@/components/CollectionsSlider';
import PhilosophySlider from '@/components/PhilosophySlider';
import TwelveInches from '@/components/TwelveInches';
import SignatureSection from '@/components/SignatureSection';
import InvitationMoment from '@/components/InvitationMoment';
import FindFormSection from '@/components/FindFormSection';
import CategoryCardsSection from '@/components/CategoryCardsSection';
import CoCreateSection from '@/components/CoCreateSection';
import DailySignpostSection from '@/components/DailySignpostSection';
import InvitationsMoreSection from '@/components/InvitationsMoreSection';
import HeritageSection from '@/components/HeritageSection';
import {
  buildLocalBusiness,
  buildWebSite,
  jsonLdScript,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Handcrafted Luxury Jewelry · Los Angeles · Est. 1984',
  description:
    'Discover DANHOV — luxury handcrafted engagement rings, wedding bands, and fine jewelry in 14k or 18k gold. Made to order in Los Angeles since 1984. Lifetime craftsmanship warranty.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildLocalBusiness())}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildWebSite())}
      />

      <HomepageScripts />

      {/* ── HERO — light centered design ─────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div className="cinematic-hero">
            <div className="ch-line ch-silence" id="chLine1">In Silence</div>
            <div className="ch-line ch-realized" id="chLine2">I realized</div>
            <div className="ch-line ch-oneness" id="chLine3">the oneness of the universe.</div>
            <div className="hero-rule" id="chDiv" />
            <div className="ch-line ch-ring" id="chLine4">The Swirl Love Ring</div>
            <div className="ch-line ch-messaged" id="chLine5">was messaged.</div>
          </div>

          <div className="origin-founder" id="heroFounder" style={{ opacity: 0 }}>
            <div className="origin-founder-line" />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 'clamp(11px,1.4vw,14px)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
              Jack Hovsepian — Founder, DANHOV — Est. 1984
            </span>
            <div className="origin-founder-line" />
          </div>
        </div>

        <div className="hero-scroll" id="heroScroll" style={{ opacity: 0 }}>
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── SIGNATURE RING ───────────────────────────────────────── */}
      <SignatureSection />

      {/* ── INVITATION MOMENT ────────────────────────────────────── */}
      <InvitationMoment />

      {/* ── FIND YOUR FORM (DIAMOND SHAPES) ──────────────────────── */}
      <FindFormSection />

      {/* ── FEATURED IN ──────────────────────────────────────────── */}
      <div className="featured-eyebrow">AS SEEN IN</div>
      <div className="featured-section">
        <div className="featured-logos">
          {[0, 1].map((set) => (
            <div key={set} className="featured-set" aria-hidden={set === 1 ? true : undefined}>
              <span className="featured-logo">
                <svg height="28" viewBox="0 0 136 28" xmlns="http://www.w3.org/2000/svg">
                  <text y="24" fontFamily="'Playfair Display',serif" fontSize="25" fontWeight="800" fill="#111111" letterSpacing="6">VOGUE</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="42" viewBox="0 0 138 42" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Montserrat',sans-serif" fontSize="9" fontWeight="500" fill="#111111" letterSpacing="3.5">HARPER&apos;S</text>
                  <text y="38" fontFamily="'Playfair Display',serif" fontSize="22" fontWeight="700" fill="#C8102E" letterSpacing="1">BAZAAR</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="28" viewBox="0 0 76 28" xmlns="http://www.w3.org/2000/svg">
                  <text y="24" fontFamily="'Playfair Display',serif" fontSize="26" fontWeight="800" fill="#111111" letterSpacing="2">WWD</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="32" viewBox="0 0 118 32" xmlns="http://www.w3.org/2000/svg">
                  <text y="26" fontFamily="'Cormorant Garamond',serif" fontSize="28" fontWeight="600" fontStyle="italic" fill="#111111" letterSpacing="3">Brides</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="34" viewBox="0 0 148 34" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Montserrat',sans-serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="2">WHO WHAT</text>
                  <text y="30" fontFamily="'Montserrat',sans-serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="9.5">WEAR</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="36" viewBox="0 0 130 36" xmlns="http://www.w3.org/2000/svg">
                  <text y="15" fontFamily="'Cormorant Garamond',serif" fontSize="13" fontWeight="600" fill="#0B2C4A" letterSpacing="3">TOWN &amp;</text>
                  <text y="34" fontFamily="'Cormorant Garamond',serif" fontSize="13" fontWeight="600" fill="#0B2C4A" letterSpacing="1">COUNTRY</text>
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PHILOSOPHY SLIDER ────────────────────────────────────── */}
      <PhilosophySlider />

      {/* ── 12 INCHES MOMENT ─────────────────────────────────────── */}
      <TwelveInches />

      {/* ── MARQUEE QUOTE ────────────────────────────────────────── */}
      <div className="marquee-quote">
        <div className="marquee-inner">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: 'contents' }}>
              <span className="marquee-text">Be like water, my friend. <span>✦</span></span>
              <span className="marquee-text">Empty your mind — be formless, shapeless, like water. <span>✦</span></span>
              <span className="marquee-text">Water can flow, or it can crash. <span>✦</span></span>
            </span>
          ))}
        </div>
      </div>

      {/* ── RING SHOWCASE ────────────────────────────────────────── */}
      <section className="ring-section">
        <div className="ring-visual">
          <div className="ring-img-circle">
            <Image src="/triad-galaxy.png" alt="The Galaxy — DANHOV Abbraccio Swirl Ring" fill style={{ objectFit: 'contain' }} sizes="(max-width: 768px) 80vw, 45vw" />
          </div>
        </div>
        <div className="ring-content">
          <span className="ring-eyebrow">The Signature Ring</span>
          <h2 className="ring-title">Sacred geometry,<br /><em>set in gold.</em></h2>
          <p className="ring-body">Every DANHOV ring is handcrafted in Los Angeles using a spiral technique that mirrors the geometry of galaxies, seashells, and vortexes. When you wear this ring, you wear the signature of the universe itself.</p>
          <div className="ring-stats">
            <div>
              <span className="ring-stat-num">42+</span>
              <span className="ring-stat-label">Years of craft</span>
            </div>
            <div>
              <span className="ring-stat-num">#1</span>
              <span className="ring-stat-label">Sustainable brand</span>
            </div>
            <div>
              <span className="ring-stat-num">∞</span>
              <span className="ring-stat-label">The circle</span>
            </div>
          </div>
          <Link href="/engagement-rings" className="btn-solid">Explore the Ring</Link>
          <Link href="/engagement-rings" className="btn-solid">Build Yours</Link>
        </div>
      </section>

      {/* ── COLLECTIONS SLIDER ───────────────────────────────────── */}
      <section className="collections-section">
        <div className="collections-header">
          <span className="section-eyebrow">Collections</span>
          <h2 className="section-title">Every form of <em>love</em></h2>
        </div>

        <CollectionsSlider
          cards={[
            { img: '/triad-galaxy.png',  collection: 'Engagement Rings', title: 'The Galaxy Ring',     desc: "Sacred geometry inspired by the spiral of galaxies. Diamonds trace the universe's oldest pattern.",    href: '/engagement-rings' },
            { img: '/triad-ring.jpg',    collection: 'Engagement Rings', title: 'The Spiral Band',     desc: 'A single unbroken spiral — the form nature uses to write infinity. Set in 18k gold.',                 href: '/engagement-rings' },
            { img: '/triad-vortex.jpg',  collection: 'Engagement Rings', title: 'The Vortex',          desc: 'Where energy converges into form. Platinum and diamond moving in sacred motion.',                   href: '/engagement-rings' },
            { img: '/phil-1.png',        collection: 'Wedding Bands',    title: 'The Oneness Band',    desc: 'Two whole people choosing each other. The circle that begins exactly where it ends.',               href: '/wedding-bands'    },
            { img: '/phil-2.png',        collection: 'Fine Jewelry',     title: 'The Wave',            desc: 'Waves are the ocean — returning, always. Gold shaped by the pull of something invisible.',         href: '/fine-jewelry'     },
            { img: '/phil-3.jpg',        collection: "Men's Jewelry",    title: 'The Silence Ring',    desc: 'In silence, the ring was formed. Bold sacred geometry for those who travel inward.',               href: '/mens'             },
            { img: '/phil-4.jpg',        collection: 'Engagement Rings', title: 'The Journey',         desc: '12 inches from mind to heart — the longest distance a human will ever travel.',                   href: '/engagement-rings' },
            { img: '/phil-5.jpg',        collection: 'Fine Jewelry',     title: 'The Self Ring',       desc: 'The most powerful ring you will ever wear — the one you give yourself. A homecoming.',            href: '/fine-jewelry'     },
            { img: '/phil-6.jpg',        collection: 'Wedding Bands',    title: 'The Universe Band',   desc: 'You are the universe wearing itself. Rose gold, diamond, and the force that shaped galaxies.',     href: '/wedding-bands'    },
            { img: '/triad-galaxy.png',  collection: 'The U Collection', title: 'The U Ring',          desc: 'For years we shaped rings like the letter U. We never said why. Now we will.',                       href: '/u-collection'     },
          ]}
        />

        <div className="collections-ai-wrap">
          <button className="dnh-trigger dnh-trigger--big" data-dnh="I'm not sure which DANHOV collection is right for me. Can you help me find my style?">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L8 5.5L12.5 7L8 8.5L7 13L6 8.5L1.5 7L6 5.5L7 1Z" fill="currentColor" />
            </svg>
            LET US GUIDE YOU
          </button>
        </div>
      </section>

      {/* ── CATEGORY CARDS ───────────────────────────────────────── */}
      <CategoryCardsSection />

      {/* ── CO-CREATE ────────────────────────────────────────────── */}
      <CoCreateSection />

      {/* ── DAILY SIGNPOST ───────────────────────────────────────── */}
      <DailySignpostSection />

      {/* ── INVITATIONS MORE ─────────────────────────────────────── */}
      <InvitationsMoreSection />

      {/* ── HERITAGE ─────────────────────────────────────────────── */}
      <HeritageSection />
    </>
  );
}
