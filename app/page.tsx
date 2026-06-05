import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import HomepageScripts from '@/components/HomepageScripts';
import HeroCanvas from '@/components/HeroCanvas';
import CollectionsSlider from '@/components/CollectionsSlider';
import PhilosophySlider from '@/components/PhilosophySlider';
import TwelveInches from '@/components/TwelveInches';
import BookingButton from '@/components/BookingButton';
import PageBlocks from '@/components/PageBlocks';
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero">
        <HeroCanvas />

        <div className="hero-content">
          <div className="cinematic-hero">
            <div className="ch-line ch-silence" id="chLine1">In silence</div>
            <div className="ch-line ch-realized" id="chLine2">I realized</div>
            <div className="ch-line ch-oneness" id="chLine3">the oneness of the universe.</div>
            <div className="ch-divider" id="chDiv" />
            <div className="ch-line ch-ring" id="chLine4">The Swirl Love Ring</div>
            <div className="ch-line ch-messaged" id="chLine5">was messaged.</div>
          </div>

          <div className="origin-founder" id="heroFounder" style={{ opacity: 0 }}>
            <div className="origin-founder-line" />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(13px,1.6vw,18px)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
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

      {/* ── DAILY TRUTH ──────────────────────────────────────────── */}
      <div className="daily-truth" id="dailyTruth">
        <div className="daily-truth-inner">
          <span className="daily-label">Today&apos;s Truth</span>
          <div className="daily-message" id="dailyMessage" />
          <div className="daily-date" id="dailyDate" />
        </div>
      </div>

      {/* ── DIAMOND SHAPES ───────────────────────────────────────── */}
      <section className="shapes-section">
        <div className="shapes-header">
          <span className="section-eyebrow">Shop by Shape</span>
          <h2 className="section-title">Find your <em>form</em></h2>
        </div>
        <div className="shapes-scroll">
          {[
            // Accurate silhouettes per the GIA / industry standard renderings:
            //   Round     — circle (brilliant) with subtle inner girdle
            //   Oval      — vertical ellipse
            //   Cushion   — rounded square (NOT a hexagon)
            //   Princess  — square with point-down rotation indicator
            //   Emerald   — rectangle with corners cut (octagonal step)
            //   Pear      — proper teardrop, rounded body + single point
            //   Radiant   — rectangle with corners cut (like emerald but trimmer)
            //   Heart     — symmetrical heart with cleft
            //   Marquise  — almond / pointed oval
            //   Asscher   — square with corners cut + inner square (step facets)
            { name: 'Round', value: 'ROUND', svg: (<><circle cx="24" cy="24" r="18" stroke="#AC3438" strokeWidth="2" /><circle cx="24" cy="24" r="10" stroke="#AC3438" strokeWidth="1" opacity="0.4" /></>) },
            { name: 'Oval', value: 'OVAL', svg: (<ellipse cx="24" cy="24" rx="13" ry="19" stroke="#AC3438" strokeWidth="2" />) },
            { name: 'Cushion', value: 'CUSHION', svg: (<rect x="6" y="6" width="36" height="36" rx="9" stroke="#AC3438" strokeWidth="2" />) },
            { name: 'Emerald', value: 'EMERALD', svg: (<polygon points="14,4 34,4 44,14 44,34 34,44 14,44 4,34 4,14" stroke="#AC3438" strokeWidth="2" fill="none" />) },
            { name: 'Pear', value: 'PEAR', svg: (<path d="M24 4 C30 8 36 18 36 28 C36 38 30 44 24 44 C18 44 12 38 12 28 C12 18 18 8 24 4 Z" stroke="#AC3438" strokeWidth="2" fill="none" />) },
            { name: 'Radiant', value: 'RADIANT', svg: (<polygon points="16,4 32,4 44,16 44,32 32,44 16,44 4,32 4,16" stroke="#AC3438" strokeWidth="2" fill="none" />) },
            { name: 'Heart', value: 'HEART', svg: (<path d="M24 42 C8 30 4 18 10 11 C15 6 21 8 24 13 C27 8 33 6 38 11 C44 18 40 30 24 42 Z" stroke="#AC3438" strokeWidth="2" fill="none" />) },
            { name: 'Princess', value: 'PRINCESS', svg: (<rect x="8" y="8" width="32" height="32" stroke="#AC3438" strokeWidth="2" />) },
          ].map((s) => (
            <Link
              key={s.name}
              href={`/ring-builder/diamond?shape=${s.value}`}
              className="shape-item"
              aria-label={`Browse ${s.name} diamonds`}
            >
              <svg className="shape-svg" viewBox="0 0 48 48" fill="none">{s.svg}</svg>
              <span className="shape-name">{s.name}</span>
            </Link>
          ))}
        </div>

        {/* AI ADVISOR — continuation of the dark mystical run so the
            button's cream halo reads at full strength. */}
        <div className="shapes-advisor">
          <p>Our AI jewelry advisor will guide you through every collection, metals, styles, and the stories behind each ring.</p>
        <button className="dnh-trigger dnh-trigger--hero" data-dnh="I'm looking for a DANHOV ring. Can you help me find the right one?">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L13.4 8.4L20 10L13.4 11.6L12 18L10.6 11.6L4 10L10.6 8.4L12 2Z" fill="currentColor"/>
            <circle cx="19" cy="19" r="1.8" fill="currentColor" opacity="0.8"/>
            <circle cx="5.5" cy="17" r="1.1" fill="currentColor" opacity="0.6"/>
          </svg>
          ASK THE ADVISOR
        </button>
        </div>
      </section>

      {/* VIDEO SECTION removed per client request. */}

      {/* ── SPIRAL PHILOSOPHY ────────────────────────────────────── */}
      <section className="spiral-section">
        <span className="section-eyebrow">The Philosophy of Oneness</span>
        <h2 className="section-title">The same force that shapes <em>galaxies</em>, shapes love.</h2>
        <p className="section-body">
          From the arms of the Milky Way to the vortex of water in a cup — the spiral is the universe&apos;s oldest signature. DANHOV rings carry this truth in every curve, every setting, every stone.
        </p>

        <div className="spiral-triad">
          <div className="triad-item">
            <div className="triad-illustration" aria-hidden="true"><GalaxyIllustration /></div>
            <div className="triad-title">The Galaxy</div>
            <p className="triad-body">Billions of stars spiral outward from a single point — the same pattern nature repeats at every scale.</p>
          </div>
          <div className="triad-item">
            <div className="triad-illustration" aria-hidden="true"><VortexIllustration /></div>
            <div className="triad-title">The Vortex</div>
            <p className="triad-body">Stir water in a cup. Watch the galaxy appear. The universe expressing itself in your kitchen.</p>
          </div>
          <div className="triad-item">
            <div className="triad-illustration triad-illustration--photo" aria-hidden="true">
              <Image
                src="/triad-galaxy-cut.png"
                alt=""
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 760px) 70vw, 220px"
              />
            </div>
            <div className="triad-title">The Ring</div>
            <p className="triad-body">A spiral band. Diamonds like stars. The same sacred geometry — now worn on the hand of love.</p>
          </div>
        </div>
      </section>

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

      {/* ── BIG QUOTE ────────────────────────────────────────────── */}
      <section className="big-quote">
        <blockquote className="big-quote-text">
          &ldquo;Out beyond ideas of wrongdoing and rightdoing, there is a field.<br />
          I&apos;ll meet you <em>there</em>.&rdquo;
        </blockquote>
        <div className="big-quote-author">~Rumi</div>
      </section>

      {/* THE U COLLECTION lives on its own page now — accessible via the
          "U" filter chip on /engagement-rings or directly at /u-collection */}

      {/* ── VIRTUAL APPOINTMENT — Sacred Ring layout ────────────── */}
      <section className="appt-sacred" id="appointment">
        <div className="appt-sacred-bg" aria-hidden="true" />
        <div className="appt-sacred-grid">

          {/* LEFT — narrative + primary CTA */}
          <div className="appt-sacred-left">
            <span className="appt-sacred-eyebrow">— A Personal Experience</span>
            <h2 className="appt-sacred-title">
              Book a Virtual<br />Appointment
            </h2>
            <div className="appt-sacred-divider" />
            <p className="appt-sacred-body">
              Connect in a sacred space. Receive guidance,
              insight and jewelry expertise — all from
              the comfort of your home.
            </p>
            <ul className="appt-sacred-features">
              <li><span className="appt-sacred-feature-icon">∞</span><span>One-on-one with a spiritual jewelry expert</span></li>
              <li><span className="appt-sacred-feature-icon">✦</span><span>Live consultation &amp; ring preview</span></li>
              <li><span className="appt-sacred-feature-icon">◇</span><span>Diamond guidance with clarity &amp; meaning</span></li>
              <li><span className="appt-sacred-feature-icon">❀</span><span>No pressure, only alignment</span></li>
              <li><span className="appt-sacred-feature-icon">✿</span><span>Available worldwide via Zoom or FaceTime</span></li>
            </ul>
            <BookingButton label="Begin Your Journey" className="appt-sacred-cta" />
            <p className="appt-sacred-foot">Taking this step is connecting to something greater</p>
          </div>

          {/* RIGHT — the luminous ring */}
          <div className="appt-sacred-right">
            <div className="appt-sacred-ring">
              {/* Top star */}
              <div className="appt-sacred-star appt-sacred-star--top" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28">
                  <path d="M12 1l1.6 7.4L21 10l-7.4 1.6L12 23l-1.6-11.4L3 10l7.4-1.6L12 1Z" fill="#FEF9EF" />
                </svg>
              </div>
              {/* Bottom star */}
              <div className="appt-sacred-star appt-sacred-star--bottom" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d="M12 1l1.6 7.4L21 10l-7.4 1.6L12 23l-1.6-11.4L3 10l7.4-1.6L12 1Z" fill="#FEF9EF" />
                </svg>
              </div>

              <div className="appt-sacred-ring-inner">
                <div className="appt-sacred-ring-eyebrow">Reserve Your Time</div>
                <div className="appt-sacred-ring-divider" />
                <p className="appt-sacred-ring-body">
                  Choose a time that aligns with you.<br />
                  Your consultation is held privately over Zoom<br />
                  — in a space of light and intention.
                </p>

                <ul className="appt-sacred-ring-list">
                  <li><CalendarGlyph /><span>30 minute, fully private</span></li>
                  <li><ClockGlyph /><span>Choose your date &amp; time</span></li>
                  <li><CameraGlyph /><span>Zoom link sent to email</span></li>
                  <li><LockGlyph /><span>No deposit needed to book</span></li>
                </ul>

                <BookingButton label="Connect to the Light" className="appt-sacred-pill" />
              </div>
            </div>

            <p className="appt-sacred-bless">
              <em>We are here to guide,</em><br />
              <em>You are here to receive</em>
              <span aria-hidden="true">♡</span>
            </p>
          </div>
        </div>
      </section>


      {/* ── ADMIN-MANAGED BLOCKS (editable in /admin/content/home) ──── */}
      <PageBlocks pageSlug="home" />


      {/* ── NEWSLETTER ───────────────────────────────────────────── */}
      <section className="newsletter-section" id="newsletter">
        <h2 className="newsletter-title">Join the <em>Oneness</em> Circle</h2>
        <p className="newsletter-sub">Spiritual teachings · New collections · Exclusive events · Stories of love</p>
        <div className="newsletter-form">
          <input type="email" className="newsletter-input" placeholder="Your email address" />
          <button className="newsletter-btn">Join</button>
        </div>
      </section>
    </>
  );
}

// ── Tiny line-icon glyphs used inside the sacred ring ─────────────────
function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="#FEF9EF" strokeWidth="1.4" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="#FEF9EF" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function ClockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="#FEF9EF" strokeWidth="1.4" />
      <path d="M12 7.5V12l3.5 2" stroke="#FEF9EF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="13" height="10" rx="2" stroke="#FEF9EF" strokeWidth="1.4" />
      <path d="M16 11l5-3v8l-5-3" stroke="#FEF9EF" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="#FEF9EF" strokeWidth="1.4" />
      <path d="M8 10.5V8a4 4 0 1 1 8 0v2.5" stroke="#FEF9EF" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Spiral-philosophy triad illustrations ─────────────────────────────
// SVG art rather than photos so each piece reads as "Galaxy / Vortex /
// Ring" instead of three near-identical ring photos. All on the dark
// mystical bg, cream / amber strokes to match the rest of the page.

function GalaxyIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="triad-svg">
      <defs>
        <radialGradient id="galaxyCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#AC3438" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#9b6b4a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#9b6b4a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke="#AC3438" fill="none" strokeWidth="1.2" opacity="0.7">
        <path d="M120 120 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
        <path d="M120 120 C 130 110, 150 100, 170 110 C 200 130, 195 170, 165 185 C 130 205, 90 195, 75 165 C 60 130, 80 95, 115 90" strokeWidth="1.3" />
        <path d="M120 120 C 110 130, 90 140, 70 130 C 40 110, 45 70, 75 55 C 110 35, 150 45, 165 75 C 180 110, 160 145, 125 150" strokeWidth="1.3" />
      </g>
      <circle cx="120" cy="120" r="38" fill="url(#galaxyCore)" />
      <circle cx="120" cy="120" r="5" fill="#AC3438" opacity="0.6" />
      <g fill="#9b6b4a" opacity="0.5">
        <circle cx="48" cy="64" r="1.4" />
        <circle cx="190" cy="58" r="1.1" />
        <circle cx="208" cy="142" r="1.5" />
        <circle cx="172" cy="200" r="1.2" />
        <circle cx="68" cy="190" r="1.4" />
        <circle cx="32" cy="138" r="1.2" />
      </g>
    </svg>
  );
}

function VortexIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="triad-svg">
      <g stroke="#AC3438" fill="none">
        <ellipse cx="120" cy="120" rx="98" ry="92" strokeWidth="1" opacity="0.25" />
        <ellipse cx="121" cy="122" rx="82" ry="78" strokeWidth="1" opacity="0.35" />
        <ellipse cx="122" cy="123" rx="66" ry="64" strokeWidth="1.1" opacity="0.45" />
        <ellipse cx="123" cy="124" rx="52" ry="50" strokeWidth="1.1" opacity="0.55" />
        <ellipse cx="124" cy="125" rx="38" ry="37" strokeWidth="1.2" opacity="0.65" />
        <ellipse cx="125" cy="126" rx="24" ry="24" strokeWidth="1.2" opacity="0.8" />
        <ellipse cx="126" cy="127" rx="12" ry="12" strokeWidth="1.3" opacity="1" />
      </g>
      <circle cx="127" cy="128" r="3" fill="#AC3438" opacity="0.7" />
    </svg>
  );
}

function RingIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="triad-svg">
      <defs>
        <radialGradient id="ringHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF9EF" stopOpacity="0" />
          <stop offset="60%" stopColor="#F8E6AF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F8E6AF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="130" r="110" fill="url(#ringHalo)" opacity="0.7" />
      {/* Ring outline — a solitaire profile drawn as a wire shape */}
      <g stroke="#FEF9EF" fill="none" strokeWidth="1.6">
        {/* Band — front + back arcs */}
        <ellipse cx="120" cy="150" rx="65" ry="55" />
        <path d="M55 150 a65 12 0 0 0 130 0" strokeWidth="1.1" opacity="0.6" />
        {/* Diamond bezel above */}
        <path d="M105 95 L120 70 L135 95 L120 110 Z" />
        {/* Diamond inner facets */}
        <path d="M120 70 L120 110 M105 95 L135 95" strokeWidth="0.8" opacity="0.7" />
        {/* Prongs holding the diamond */}
        <path d="M108 100 L104 112 M132 100 L136 112" strokeWidth="1" />
      </g>
      {/* Sparkle highlight */}
      <circle cx="116" cy="84" r="2" fill="#FEF9EF" />
      <circle cx="128" cy="90" r="1" fill="#FEF9EF" opacity="0.7" />
    </svg>
  );
}
