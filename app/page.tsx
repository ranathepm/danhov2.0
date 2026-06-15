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
            <span style={{ fontFamily: "'Nunito Sans', sans-serif", fontSize: 'clamp(11px,1.4vw,14px)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
              Jack Hovsepian — Founder, DANHOV — Est. 1984
            </span>
            <div className="origin-founder-line" />
          </div>
        </div>

      </section>

      {/* ── SIGNATURE RING ───────────────────────────────────────── */}
      <SignatureSection />

      {/* ── DAILY SIGNPOST (Babig's Wisdom) ──────────────────────── */}
      <DailySignpostSection />

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
                  <text y="24" fontFamily="'Nunito Sans', sans-serif" fontSize="25" fontWeight="800" fill="#111111" letterSpacing="6">VOGUE</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="42" viewBox="0 0 138 42" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Nunito Sans', sans-serif" fontSize="9" fontWeight="500" fill="#111111" letterSpacing="3.5">HARPER&apos;S</text>
                  <text y="38" fontFamily="'Nunito Sans', sans-serif" fontSize="22" fontWeight="700" fill="#C8102E" letterSpacing="1">BAZAAR</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="28" viewBox="0 0 76 28" xmlns="http://www.w3.org/2000/svg">
                  <text y="24" fontFamily="'Nunito Sans', sans-serif" fontSize="26" fontWeight="800" fill="#111111" letterSpacing="2">WWD</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="32" viewBox="0 0 118 32" xmlns="http://www.w3.org/2000/svg">
                  <text y="26" fontFamily="'Nunito Sans', sans-serif" fontSize="28" fontWeight="600" fontStyle="italic" fill="#111111" letterSpacing="3">Brides</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="34" viewBox="0 0 148 34" xmlns="http://www.w3.org/2000/svg">
                  <text y="14" fontFamily="'Nunito Sans', sans-serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="2">WHO WHAT</text>
                  <text y="30" fontFamily="'Nunito Sans', sans-serif" fontSize="10" fontWeight="600" fill="#111111" letterSpacing="9.5">WEAR</text>
                </svg>
              </span>
              <span className="featured-logo">
                <svg height="36" viewBox="0 0 130 36" xmlns="http://www.w3.org/2000/svg">
                  <text y="15" fontFamily="'Nunito Sans', sans-serif" fontSize="13" fontWeight="600" fill="#0B2C4A" letterSpacing="3">TOWN &amp;</text>
                  <text y="34" fontFamily="'Nunito Sans', sans-serif" fontSize="13" fontWeight="600" fill="#0B2C4A" letterSpacing="1">COUNTRY</text>
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ENGAGEMENT RINGS — collection cards with Life Path ───── */}
      <CategoryCardsSection />

      {/* ── CO-CREATE ────────────────────────────────────────────── */}
      <CoCreateSection />

      {/* ── INVITATIONS MORE ─────────────────────────────────────── */}
      <InvitationsMoreSection />

      {/* ── HERITAGE ─────────────────────────────────────────────── */}
      <HeritageSection />
    </>
  );
}
