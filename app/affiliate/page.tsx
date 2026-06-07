import type { Metadata } from 'next';
import AffiliateForm from '@/components/AffiliateForm';

export const metadata: Metadata = {
  title: 'Affiliate Program · DANHOV Jewelry',
  description:
    'Earn commission by sharing handcrafted DANHOV jewelry. Join our affiliate program and earn 8% on every sale you refer — tracked for 30 days, paid monthly.',
  alternates: { canonical: '/affiliate' },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Apply & Get Approved',
    body: 'Submit your application below. Our team reviews every affiliate individually and responds within two business days.',
  },
  {
    step: '02',
    title: 'Get Your Unique Link',
    body: 'Once approved, you receive a unique tracking link and access to our affiliate dashboard — with real-time click, conversion, and commission data.',
  },
  {
    step: '03',
    title: 'Share with Your Audience',
    body: 'Post your link on Instagram, Pinterest, YouTube, your blog, or newsletter. We provide hi-res imagery and copy you can use.',
  },
  {
    step: '04',
    title: 'Earn on Every Sale',
    body: 'Earn 8% commission on every completed order attributed to your link, with a 30-day cookie window. Paid monthly via bank transfer or PayPal.',
  },
];

const TIERS = [
  {
    name: 'Ambassador',
    rate: '8%',
    threshold: 'All approved affiliates',
    perks: ['Unique tracking link', 'Real-time dashboard', 'Co-branded imagery', 'Monthly payouts'],
  },
  {
    name: 'Elite',
    rate: '10%',
    threshold: '$10,000+ referred monthly',
    perks: ['Everything in Ambassador', 'Priority support', 'Early collection previews', 'Custom discount codes'],
    highlight: true,
  },
  {
    name: 'VIP Partner',
    rate: '12%',
    threshold: '$30,000+ referred monthly',
    perks: ['Everything in Elite', 'Dedicated account manager', 'Custom co-branded landing page', 'Quarterly gifts from the atelier'],
  },
];

export default function AffiliatePage() {
  return (
    <main className="aff-page">
      <style>{`
        .aff-page { font-family: 'Jost', sans-serif; color: #1a1410; background: #faf6f1; }

        /* Hero */
        .aff-hero {
          background: linear-gradient(160deg, #1a1410 0%, #2c1f18 55%, #3d2a20 100%);
          padding: 100px 24px 84px; text-align: center; position: relative; overflow: hidden;
        }
        .aff-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 50% 40% at 50% 65%, rgba(184,146,58,0.11) 0%, transparent 70%);
          pointer-events: none;
        }
        .aff-eyebrow {
          display: block; font-size: 11px; letter-spacing: 0.22em;
          text-transform: uppercase; color: #b8923a; margin-bottom: 18px;
        }
        .aff-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 5.5vw, 60px); font-weight: 400;
          color: #faf6f1; margin: 0 auto 22px; max-width: 680px; line-height: 1.15;
        }
        .aff-hero-sub {
          font-size: 15px; color: #c4b8ad; max-width: 500px; margin: 0 auto 40px; line-height: 1.7;
        }
        .aff-hero-badges {
          display: flex; justify-content: center; gap: 24px; flex-wrap: wrap;
        }
        .aff-badge {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; color: #b8923a; letter-spacing: 0.06em;
        }
        .aff-badge::before { content: '✦'; font-size: 10px; }

        /* How it works */
        .aff-how { background: #fff; padding: 80px 24px; }
        .aff-how-inner { max-width: 1000px; margin: 0 auto; }
        .aff-section-label {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #b8923a; margin-bottom: 12px; display: block; text-align: center;
        }
        .aff-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 4vw, 38px); font-weight: 400;
          text-align: center; color: #1a1410; margin: 0 0 52px;
        }
        .aff-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
        }
        .aff-step { text-align: center; }
        .aff-step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px; color: rgba(184,146,58,0.2); line-height: 1;
          display: block; margin-bottom: 14px;
        }
        .aff-step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 19px; color: #1a1410; margin-bottom: 8px;
        }
        .aff-step-body { font-size: 13.5px; color: #6b5e57; line-height: 1.65; }

        /* Tiers */
        .aff-tiers { background: #faf6f1; padding: 80px 24px; }
        .aff-tiers-inner { max-width: 1000px; margin: 0 auto; }
        .aff-tiers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px; margin-top: 52px;
        }
        .aff-tier {
          background: #fff; border: 1px solid #ede8e2;
          border-radius: 10px; padding: 32px 28px; position: relative;
        }
        .aff-tier.highlight {
          border-color: #b8923a; border-width: 2px;
          box-shadow: 0 8px 32px rgba(184,146,58,0.12);
        }
        .aff-tier-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: #b8923a; color: #fff; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 14px; border-radius: 999px; white-space: nowrap;
        }
        .aff-tier-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; color: #1a1410; margin-bottom: 4px;
        }
        .aff-tier-threshold { font-size: 12px; color: #9c8f86; margin-bottom: 20px; }
        .aff-tier-rate {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px; color: #b8923a; line-height: 1;
          margin-bottom: 4px;
        }
        .aff-tier-rate-label { font-size: 12px; color: #8a7f76; margin-bottom: 24px; letter-spacing: 0.06em; }
        .aff-tier-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .aff-tier-perks li {
          font-size: 13.5px; color: #6b5e57; display: flex; gap: 10px; align-items: flex-start;
        }
        .aff-tier-perks li::before { content: '✓'; color: #b8923a; flex-shrink: 0; margin-top: 1px; }

        /* Application */
        .aff-apply { background: #fff; padding: 80px 24px; }
        .aff-apply-inner { max-width: 640px; margin: 0 auto; }
        .aff-apply-intro {
          font-size: 15px; color: #6b5e57; line-height: 1.7;
          text-align: center; margin-bottom: 44px;
        }
        .aff-form { display: flex; flex-direction: column; gap: 18px; }
        .aff-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .aff-form-group { display: flex; flex-direction: column; gap: 6px; }
        .aff-form-group label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a7f76;
        }
        .aff-form-group input,
        .aff-form-group select,
        .aff-form-group textarea {
          border: 1px solid #d4c9c0; border-radius: 6px;
          padding: 11px 14px; font-size: 14px; font-family: 'Jost', sans-serif;
          background: #fff; color: #1a1410; outline: none; transition: border-color 0.15s;
        }
        .aff-form-group input:focus,
        .aff-form-group select:focus,
        .aff-form-group textarea:focus { border-color: #b8923a; }
        .aff-form-group textarea { resize: vertical; min-height: 90px; }
        .aff-submit {
          background: #1a1410; color: #faf6f1; border: none; border-radius: 999px;
          padding: 14px 44px; font-size: 13px; font-family: 'Jost', sans-serif;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; align-self: center; transition: background 0.2s;
        }
        .aff-submit:hover { background: #b8923a; }
        .aff-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .aff-form-error {
          font-size: 13px; color: #AC3438; margin: 0; padding: 10px 14px;
          background: rgba(172,52,56,0.06); border-left: 3px solid #AC3438; border-radius: 4px;
        }
        .aff-success {
          text-align: center; padding: 48px 24px;
          background: rgba(184,146,58,0.04); border: 1px solid rgba(184,146,58,0.2);
          border-radius: 12px;
        }
        .aff-success-icon { font-size: 32px; color: #b8923a; margin-bottom: 16px; }
        .aff-success-title {
          font-family: 'Cormorant Garamond', serif; font-size: 28px;
          color: #1a1410; margin: 0 0 12px;
        }
        .aff-success-body { font-size: 15px; color: #6b5e57; line-height: 1.7; margin: 0; }

        @media (max-width: 600px) {
          .aff-form-row { grid-template-columns: 1fr; }
          .aff-hero { padding: 76px 20px 60px; }
          .aff-hero-badges { flex-direction: column; align-items: center; }
        }
      `}</style>

      {/* Hero */}
      <section className="aff-hero">
        <span className="aff-eyebrow">Affiliate Program</span>
        <h1>Share Sacred Geometry. Earn Commission.</h1>
        <p className="aff-hero-sub">
          Love DANHOV? Share it. Earn 8–12% commission on every sale you refer —
          tracked for 30 days, paid monthly, with no cap on earnings.
        </p>
        <div className="aff-hero-badges">
          <span className="aff-badge">8% base commission</span>
          <span className="aff-badge">30-day cookie window</span>
          <span className="aff-badge">Monthly payouts</span>
          <span className="aff-badge">Real-time dashboard</span>
        </div>
      </section>

      {/* How it works */}
      <section className="aff-how">
        <div className="aff-how-inner">
          <p className="aff-section-label">How It Works</p>
          <h2 className="aff-section-title">Four steps to earning with DANHOV</h2>
          <div className="aff-steps">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="aff-step">
                <span className="aff-step-num">{s.step}</span>
                <p className="aff-step-title">{s.title}</p>
                <p className="aff-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="aff-tiers">
        <div className="aff-tiers-inner">
          <p className="aff-section-label">Commission Tiers</p>
          <h2 className="aff-section-title">The more you share, the more you earn</h2>
          <div className="aff-tiers-grid">
            {TIERS.map((t) => (
              <div key={t.name} className={`aff-tier${t.highlight ? ' highlight' : ''}`}>
                {t.highlight && <span className="aff-tier-badge">Most Popular</span>}
                <p className="aff-tier-name">{t.name}</p>
                <p className="aff-tier-threshold">{t.threshold}</p>
                <p className="aff-tier-rate">{t.rate}</p>
                <p className="aff-tier-rate-label">commission per sale</p>
                <ul className="aff-tier-perks">
                  {t.perks.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application */}
      <section className="aff-apply" id="apply">
        <div className="aff-apply-inner">
          <p className="aff-section-label" style={{ textAlign: 'center' }}>Join the Program</p>
          <h2 className="aff-section-title">Apply to become an affiliate</h2>
          <p className="aff-apply-intro">
            We approve bloggers, content creators, influencers, stylists, wedding planners,
            and anyone with an engaged audience who loves fine jewelry. Tell us about yourself.
          </p>
          <AffiliateForm />
        </div>
      </section>
    </main>
  );
}
