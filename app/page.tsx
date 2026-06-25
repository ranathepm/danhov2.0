import type { Metadata } from 'next';
import HomepageScripts from '@/components/HomepageScripts';
import ScrollToHash from '@/components/ScrollToHash';
import SignatureSection from '@/components/SignatureSection';
import InvitationMoment from '@/components/InvitationMoment';
import FindFormSection from '@/components/FindFormSection';
import CategoryCardsSection from '@/components/CategoryCardsSection';
import CoCreateSection from '@/components/CoCreateSection';
import DailySignpostSection from '@/components/DailySignpostSection';
import InvitationsMoreSection from '@/components/InvitationsMoreSection';
import HeritageSection from '@/components/HeritageSection';
import TrustProofSection from '@/components/TrustProofSection';
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

export const revalidate = 300;

export default async function HomePage() {
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
      <ScrollToHash />

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
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(11px,1.4vw,14px)', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#111111' }}>
              Jack Hovsepian — Founder, DANHOV — Est. 1984
            </span>
            <div className="origin-founder-line" />
          </div>

          {/* ── Abbraccio ring — breathes subtly in the first screen ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="hero-ring-wrap" id="heroRingWrap" style={{ opacity: 0 }}>
            <img
              src="https://wirbqklbygxuafelsqql.supabase.co/storage/v1/object/public/product-images/products/AE505UQ/platinum/Danhov%20Abbraccio%20Swirl%20Diamond%20Engagement%20Ring%20AE505UQ_1.jpg"
              alt="Abbraccio Swirl Diamond Engagement Ring — DANHOV Los Angeles"
              className="hero-ring-img"
              width={200}
              height={200}
            />
          </div>

          {/* ── Trust line — clarity for first-time visitors ── */}
          <p className="hero-trust-line" id="heroTrustLine" style={{ opacity: 0 }}>
            Award-winning engagement rings handcrafted in Los Angeles since 1984.
          </p>
        </div>

      </section>

      {/* ── BRAND VIDEO ──────────────────────────────────────────── */}
      <section style={{
        background: '#0a0806',
        padding: '72px 0 0',
        position: 'relative',
      }}>
        {/* top accent line */}
        <div style={{
          width: 40, height: 1,
          background: '#AC3438',
          margin: '0 auto 40px',
        }} />

        {/* eyebrow */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          color: '#f2ece4',
          textAlign: 'center',
          margin: '0 0 56px',
        }}>
          Handcrafted in Los Angeles · Est. 1984
        </p>

        {/* video wrapper — natural 16:9, no cropping */}
        <div style={{ position: 'relative', lineHeight: 0 }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: 'auto', display: 'block' }}
            src="/danhov-brand-video.mp4"
          />

          {/* bottom gradient + wordmark overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '38%',
            background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.5) 55%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 0 40px',
            pointerEvents: 'none',
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
              fontWeight: 300,
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: '#f2ece4',
              display: 'block',
              lineHeight: 1,
            }}>
              DANHOV
            </span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '0.6rem',
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: '#f2ece4',
              marginTop: 10,
              fontWeight: 600,
            }}>
              The Art of the Ring
            </span>
          </div>
        </div>

        {/* bottom bar */}
        <div style={{
          background: '#0a0806',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}>
          <div style={{ width: 40, height: 1, background: 'rgba(172,52,56,0.3)' }} />
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '0.6rem',
            letterSpacing: '0.45em',
            textTransform: 'uppercase',
            color: '#4a4240',
            fontWeight: 500,
          }}>
            Every piece handcrafted to order
          </span>
          <div style={{ width: 40, height: 1, background: 'rgba(172,52,56,0.3)' }} />
        </div>
      </section>

      {/* ── DAILY SIGNPOST ───────────────────────────────────────── */}
      <DailySignpostSection />

      {/* ── DESIGN IN SILENCE — 4-step process ───────────────────── */}
      <CoCreateSection />

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
                  <text y="24" fontFamily="'Cormorant Garamond',serif" fontSize="25" fontWeight="800" fill="#111111" letterSpacing="6">VOGUE</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="42" viewBox="0 0 138 42" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Cormorant Garamond',serif" fontSize="9" fontWeight="500" fill="#111111" letterSpacing="3.5">HARPER&apos;S</text>
                  <text y="38" fontFamily="'Cormorant Garamond',serif" fontSize="22" fontWeight="700" fill="#C8102E" letterSpacing="1">BAZAAR</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="28" viewBox="0 0 76 28" xmlns="http://www.w3.org/2000/svg">
                  <text y="24" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="800" fill="#111111" letterSpacing="2">WWD</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="32" viewBox="0 0 118 32" xmlns="http://www.w3.org/2000/svg">
                  <text y="26" fontFamily="'Cormorant Garamond',serif" fontSize="28" fontWeight="600" fontStyle="italic" fill="#111111" letterSpacing="3">Brides</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="34" viewBox="0 0 148 34" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Cormorant Garamond',serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="2">WHO WHAT</text>
                  <text y="30" fontFamily="'Cormorant Garamond',serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="9.5">WEAR</text>
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

      {/* ── ENGAGEMENT RINGS — collection cards with Life Path ───── */}
      <CategoryCardsSection />

      {/* ── SIGNATURE RING — editorial dark strip ────────────────── */}
      <SignatureSection />

      {/* ── COUPLE PROOF — real testimonials ─────────────────────── */}
      <TrustProofSection />

      {/* ── WHAT WE OFFER ────────────────────────────────────────── */}
      <InvitationsMoreSection />

      {/* ── CRAFT & TRUST ────────────────────────────────────────── */}
      <HeritageSection />
    </>
  );
}
