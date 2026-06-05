import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sustainability · DANHOV Ethical Jewelry',
  description:
    'Ranked #1 Most Sustainable Jewelry Brand. Every DANHOV piece is crafted from recycled gold with conflict-free, ethically traced stones. Made in Los Angeles by artisans paid living wages.',
  alternates: { canonical: '/sustainability' },
};

const PILLARS = [
  {
    number: '01',
    title: 'Recycled Gold — Always',
    body: 'Every DANHOV ring, band, and pendant is crafted from 100% recycled gold — both 14k and 18k. No newly mined gold enters our atelier. Ever. The metal in your piece was already in the world; we gave it a more beautiful purpose.',
    stat: '100%',
    statLabel: 'recycled gold',
  },
  {
    number: '02',
    title: 'Conflict-Free Stones',
    body: 'All diamonds and gemstones we source are conflict-free and ethically traced from mine to setting. Natural diamonds carry GIA or AGS certification. Lab-grown stones are verified to the same standard — because a ring built on love should have a clean conscience.',
    stat: '100%',
    statLabel: 'conflict-free',
  },
  {
    number: '03',
    title: 'Made in Los Angeles',
    body: 'Every piece is handcrafted in our Los Angeles atelier by master jewelers who earn living wages with full benefits — healthcare, paid leave, and a stake in the quality of what they make. No offshore manufacturing. No shortcuts.',
    stat: '40+',
    statLabel: 'years in LA',
  },
  {
    number: '04',
    title: '1% for the Planet',
    body: 'One percent of every purchase goes directly to global reforestation and clean-water initiatives. Not as a rounding error on a balance sheet — as a structural commitment built into every transaction since 2019.',
    stat: '1%',
    statLabel: 'every sale',
  },
  {
    number: '05',
    title: 'Made to Order',
    body: 'We produce nothing speculatively. Every piece is made after it is commissioned — eliminating overstock, unsold inventory, and the waste that mass production demands as the price of convenience.',
    stat: '0',
    statLabel: 'wasted pieces',
  },
  {
    number: '06',
    title: 'Packaging Without Plastic',
    body: 'All DANHOV packaging is plastic-free, made from FSC-certified materials, and designed to be kept and reused — not discarded. The box your ring arrives in is worth keeping. It is part of the piece.',
    stat: '0',
    statLabel: 'plastic packaging',
  },
];

const CERTIFICATIONS = [
  'Ranked #1 Most Sustainable Jewelry Brand',
  'GIA-certified diamond sourcing',
  'Conflict-free stone compliance (Kimberley Process)',
  'Recycled metal sourcing — SCS Global verified',
  '1% for the Planet member',
  'Living wage employer — Los Angeles',
];

export default function SustainabilityPage() {
  return (
    <main className="sustain-page">
      <style>{`
        .sustain-page { font-family: 'Jost', sans-serif; color: #1a1410; background: #faf6f1; }

        /* Hero */
        .sustain-hero {
          background: linear-gradient(160deg, #0f1a12 0%, #1a2d1f 55%, #243a28 100%);
          padding: 110px 24px 90px;
          text-align: center; position: relative; overflow: hidden;
        }
        .sustain-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 55% 40% at 50% 65%, rgba(100,160,80,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .sustain-eyebrow {
          display: block; font-size: 11px; letter-spacing: 0.22em;
          text-transform: uppercase; color: #7ab86b; margin-bottom: 18px;
        }
        .sustain-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 5.5vw, 62px); font-weight: 400;
          color: #f0f5ef; margin: 0 auto 22px; max-width: 720px; line-height: 1.15;
        }
        .sustain-hero-sub {
          font-size: 15px; color: #b4c9ae; line-height: 1.7;
          max-width: 520px; margin: 0 auto 48px;
        }
        .sustain-ranked {
          display: inline-flex; align-items: center; gap: 12px;
          background: rgba(122,184,107,0.12); border: 1px solid rgba(122,184,107,0.25);
          border-radius: 999px; padding: 10px 24px;
          font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
          color: #7ab86b;
        }
        .sustain-ranked::before {
          content: '✦'; font-size: 14px;
        }

        /* Stat banner */
        .sustain-stats {
          background: #fff; border-bottom: 1px solid #ede8e2;
          padding: 40px 24px;
        }
        .sustain-stats-inner {
          max-width: 900px; margin: 0 auto;
          display: flex; justify-content: space-around; flex-wrap: wrap; gap: 32px;
          text-align: center;
        }
        .sustain-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px; font-weight: 400; color: #3a7d2c; line-height: 1;
          display: block; margin-bottom: 4px;
        }
        .sustain-stat-label { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #8a7f76; }

        /* Pillars */
        .sustain-pillars { max-width: 1100px; margin: 0 auto; padding: 80px 24px; }
        .sustain-section-label {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #7ab86b; margin-bottom: 12px; display: block; text-align: center;
        }
        .sustain-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4vw, 42px); font-weight: 400;
          text-align: center; color: #1a1410; margin: 0 0 56px;
        }
        .sustain-pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 32px;
        }
        .sustain-pillar {
          background: #fff; border: 1px solid #ede8e2; border-radius: 10px;
          padding: 32px 28px; position: relative; overflow: hidden;
        }
        .sustain-pillar::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #3a7d2c, #7ab86b);
        }
        .sustain-pillar-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px; color: #7ab86b; letter-spacing: 0.12em;
          margin-bottom: 8px; display: block;
        }
        .sustain-pillar-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: #1a1410; margin-bottom: 12px;
        }
        .sustain-pillar-body { font-size: 14px; color: #6b5e57; line-height: 1.7; margin-bottom: 20px; }
        .sustain-pillar-stat {
          display: flex; align-items: baseline; gap: 8px;
          border-top: 1px solid #ede8e2; padding-top: 16px;
        }
        .sustain-pillar-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; color: #3a7d2c; line-height: 1;
        }
        .sustain-pillar-stat-label { font-size: 12px; color: #8a7f76; letter-spacing: 0.08em; }

        /* Certifications */
        .sustain-certs {
          background: linear-gradient(135deg, #0f1a12 0%, #1a2d1f 100%);
          padding: 72px 24px;
        }
        .sustain-certs-inner { max-width: 800px; margin: 0 auto; text-align: center; }
        .sustain-certs h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px; font-weight: 400; color: #f0f5ef; margin-bottom: 40px;
        }
        .sustain-certs-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
        .sustain-certs-list li {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          font-size: 14px; color: #b4c9ae; letter-spacing: 0.04em;
        }
        .sustain-certs-list li::before { content: '✓'; color: #7ab86b; font-size: 16px; }

        /* Philosophy */
        .sustain-philosophy { background: #fff; padding: 80px 24px; }
        .sustain-philosophy-inner { max-width: 640px; margin: 0 auto; text-align: center; }
        .sustain-philosophy blockquote {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(20px, 3vw, 28px); font-weight: 400;
          color: #1a1410; line-height: 1.55; margin: 0 0 24px;
          border: none; padding: 0;
        }
        .sustain-philosophy-attr { font-size: 13px; color: #8a7f76; letter-spacing: 0.08em; }

        /* CTA */
        .sustain-cta { background: #faf6f1; padding: 72px 24px; text-align: center; }
        .sustain-cta h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 400; color: #1a1410; margin-bottom: 12px;
        }
        .sustain-cta p { font-size: 15px; color: #6b5e57; margin-bottom: 32px; max-width: 420px; margin-inline: auto; }
        .sustain-cta-btn {
          display: inline-block; background: #3a7d2c; color: #fff;
          padding: 14px 40px; border-radius: 999px;
          font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; transition: background 0.2s; margin-right: 12px;
        }
        .sustain-cta-btn:hover { background: #2d6422; }
        .sustain-cta-link {
          display: inline-block; color: #3a7d2c;
          font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
          text-decoration: none; border-bottom: 1px solid rgba(58,125,44,0.35);
          padding-bottom: 2px; transition: border-color 0.15s;
        }
        .sustain-cta-link:hover { border-color: #3a7d2c; }

        @media (max-width: 640px) {
          .sustain-hero { padding: 80px 20px 64px; }
          .sustain-stats-inner { gap: 24px; }
        }
      `}</style>

      {/* Hero */}
      <section className="sustain-hero">
        <span className="sustain-eyebrow">Sustainability</span>
        <h1>Jewelry That Gives Back More Than It Takes</h1>
        <p className="sustain-hero-sub">
          Every decision we make — the gold, the stones, the hands that craft it,
          the box it ships in — is made with the earth in mind. Not as aspiration. As practice.
        </p>
        <span className="sustain-ranked">#1 Most Sustainable Jewelry Brand</span>
      </section>

      {/* Stats */}
      <div className="sustain-stats">
        <div className="sustain-stats-inner">
          <div>
            <span className="sustain-stat-num">100%</span>
            <span className="sustain-stat-label">Recycled Gold</span>
          </div>
          <div>
            <span className="sustain-stat-num">100%</span>
            <span className="sustain-stat-label">Conflict-Free Stones</span>
          </div>
          <div>
            <span className="sustain-stat-num">1%</span>
            <span className="sustain-stat-label">to Reforestation</span>
          </div>
          <div>
            <span className="sustain-stat-num">40+</span>
            <span className="sustain-stat-label">Years Handcrafted in LA</span>
          </div>
          <div>
            <span className="sustain-stat-num">0</span>
            <span className="sustain-stat-label">Plastic Packaging</span>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <section className="sustain-pillars">
        <p className="sustain-section-label">Our Commitments</p>
        <h2 className="sustain-section-title">Six principles we never compromise</h2>
        <div className="sustain-pillars-grid">
          {PILLARS.map((p) => (
            <div key={p.number} className="sustain-pillar">
              <span className="sustain-pillar-num">{p.number}</span>
              <p className="sustain-pillar-title">{p.title}</p>
              <p className="sustain-pillar-body">{p.body}</p>
              <div className="sustain-pillar-stat">
                <span className="sustain-pillar-stat-num">{p.stat}</span>
                <span className="sustain-pillar-stat-label">{p.statLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="sustain-certs">
        <div className="sustain-certs-inner">
          <h2>Verified commitments, not marketing claims</h2>
          <ul className="sustain-certs-list">
            {CERTIFICATIONS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Philosophy */}
      <section className="sustain-philosophy">
        <div className="sustain-philosophy-inner">
          <p className="sustain-section-label">The Philosophy</p>
          <blockquote>
            &ldquo;We are already whole. The earth is already whole.
            A ring that comes from that understanding should leave the world
            more whole than it found it.&rdquo;
          </blockquote>
          <p className="sustain-philosophy-attr">— Jack Hovsepian, Founder, DANHOV</p>
        </div>
      </section>

      {/* CTA */}
      <section className="sustain-cta">
        <h2>Wear something that means something.</h2>
        <p>
          Every DANHOV piece you commission is one less reason to mine new gold
          or compromise on how artisans are treated.
        </p>
        <Link href="/engagement-rings" className="sustain-cta-btn">Shop the Collection</Link>
        <Link href="/blog/recycled-gold-what-it-means" className="sustain-cta-link">Read our sustainability story</Link>
      </section>
    </main>
  );
}
