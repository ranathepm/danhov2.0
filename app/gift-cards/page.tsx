import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gift Cards · DANHOV Luxury Jewelry',
  description:
    'Give the gift of a handcrafted DANHOV piece. Gift cards are delivered instantly by email and never expire. Redeemable on any engagement ring, wedding band, or fine jewelry.',
  alternates: { canonical: '/gift-cards' },
};

const AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function GiftCardsPage() {
  return (
    <main className="gc-page">
      <style>{`
        .gc-page { font-family: 'Jost', sans-serif; color: #1a1410; background: #faf6f1; }

        /* Hero */
        .gc-hero {
          background: linear-gradient(160deg, #1a1410 0%, #2c1f18 60%, #3d2a20 100%);
          padding: 100px 24px 80px; text-align: center; position: relative; overflow: hidden;
        }
        .gc-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 55% 40% at 50% 70%, rgba(184,146,58,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .gc-eyebrow {
          display: block; font-size: 11px; letter-spacing: 0.22em;
          text-transform: uppercase; color: #b8923a; margin-bottom: 18px;
        }
        .gc-hero h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 5.5vw, 60px); font-weight: 400;
          color: #faf6f1; margin: 0 auto 20px; max-width: 660px; line-height: 1.15;
        }
        .gc-hero-sub {
          font-size: 15px; color: #c4b8ad; max-width: 480px; margin: 0 auto; line-height: 1.7;
        }

        /* Card visual */
        .gc-card-showcase {
          background: #fff; padding: 72px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 64px;
        }
        .gc-card-visual {
          width: 100%; max-width: 480px;
          aspect-ratio: 1.586;
          background: linear-gradient(135deg, #1a1410 0%, #3d2a20 50%, #1a1410 100%);
          border-radius: 16px;
          display: flex; flex-direction: column;
          align-items: flex-start; justify-content: space-between;
          padding: 32px 36px;
          box-shadow: 0 24px 64px rgba(26,20,16,0.35), 0 4px 12px rgba(0,0,0,0.2);
          position: relative; overflow: hidden;
        }
        .gc-card-visual::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 80% 20%, rgba(184,146,58,0.18) 0%, transparent 60%);
          pointer-events: none;
        }
        .gc-card-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; color: #faf6f1; letter-spacing: 0.15em;
          position: relative; z-index: 1;
        }
        .gc-card-tagline {
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(250,246,241,0.45); margin-top: 4px;
          position: relative; z-index: 1;
        }
        .gc-card-bottom { position: relative; z-index: 1; width: 100%; }
        .gc-card-amount {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px; color: #b8923a; line-height: 1;
          margin-bottom: 6px;
        }
        .gc-card-footer {
          display: flex; justify-content: space-between; align-items: flex-end;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(250,246,241,0.4);
        }
        .gc-card-spiral {
          position: absolute; right: -20px; top: -20px;
          opacity: 0.06; pointer-events: none;
        }

        /* Amount selector */
        .gc-selector { max-width: 640px; width: 100%; }
        .gc-selector-label {
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          color: #8a7f76; margin-bottom: 16px; display: block; text-align: center;
        }
        .gc-amounts {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;
        }
        .gc-amount-btn {
          border: 1px solid #d4c9c0; border-radius: 8px;
          background: #fff; padding: 14px 8px; cursor: pointer;
          font-family: 'Cormorant Garamond', serif; font-size: 22px;
          color: #1a1410; text-align: center;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .gc-amount-btn:hover,
        .gc-amount-btn.active {
          border-color: #b8923a; color: #b8923a; background: rgba(184,146,58,0.04);
        }
        .gc-custom { display: flex; gap: 10px; margin-bottom: 24px; }
        .gc-custom-input {
          flex: 1; border: 1px solid #d4c9c0; border-radius: 8px;
          padding: 13px 16px; font-size: 15px; font-family: 'Jost', sans-serif;
          color: #1a1410; outline: none; transition: border-color 0.15s;
        }
        .gc-custom-input:focus { border-color: #b8923a; }
        .gc-custom-input::placeholder { color: #b4a89d; }

        /* Form */
        .gc-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .gc-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .gc-form-group { display: flex; flex-direction: column; gap: 6px; }
        .gc-form-group label {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: #8a7f76;
        }
        .gc-form-group input,
        .gc-form-group textarea {
          border: 1px solid #d4c9c0; border-radius: 6px;
          padding: 11px 14px; font-size: 14px; font-family: 'Jost', sans-serif;
          background: #fff; color: #1a1410; outline: none; transition: border-color 0.15s;
        }
        .gc-form-group input:focus,
        .gc-form-group textarea:focus { border-color: #b8923a; }
        .gc-form-group textarea { resize: vertical; min-height: 80px; }
        .gc-buy-btn {
          width: 100%; background: #1a1410; color: #faf6f1; border: none;
          border-radius: 999px; padding: 15px; cursor: pointer;
          font-size: 13px; font-family: 'Jost', sans-serif;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: background 0.2s;
        }
        .gc-buy-btn:hover { background: #b8923a; }

        /* How it works */
        .gc-how { background: #faf6f1; padding: 72px 24px; }
        .gc-how-inner { max-width: 900px; margin: 0 auto; }
        .gc-section-label {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #b8923a; margin-bottom: 12px; display: block; text-align: center;
        }
        .gc-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 4vw, 38px); font-weight: 400;
          text-align: center; color: #1a1410; margin: 0 0 48px;
        }
        .gc-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; }
        .gc-step { text-align: center; }
        .gc-step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px; color: rgba(184,146,58,0.2); line-height: 1;
          display: block; margin-bottom: 12px;
        }
        .gc-step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; color: #1a1410; margin-bottom: 8px;
        }
        .gc-step-body { font-size: 13.5px; color: #6b5e57; line-height: 1.65; }

        /* Fine print */
        .gc-fine { background: #fff; padding: 48px 24px; text-align: center; }
        .gc-fine p { font-size: 13px; color: #9c8f86; line-height: 1.7; max-width: 560px; margin: 0 auto; }
        .gc-fine a { color: #b8923a; text-decoration: none; }

        @media (max-width: 480px) {
          .gc-amounts { grid-template-columns: repeat(2, 1fr); }
          .gc-form-row { grid-template-columns: 1fr; }
          .gc-hero { padding: 72px 20px 56px; }
        }
      `}</style>

      {/* Hero */}
      <section className="gc-hero">
        <span className="gc-eyebrow">Gift Cards</span>
        <h1>Give the Gift of Handcrafted Gold</h1>
        <p className="gc-hero-sub">
          A DANHOV gift card is delivered instantly, never expires, and redeems
          against any piece in the collection — including custom commissions.
        </p>
      </section>

      {/* Card visual + form */}
      <section className="gc-card-showcase">
        {/* Gift card preview */}
        <div className="gc-card-visual">
          <svg className="gc-card-spiral" width="260" height="260" viewBox="0 0 260 260" fill="none">
            <path d="M130 20 Q190 20 210 80 Q230 140 190 180 Q150 220 90 200 Q30 180 20 120 Q10 60 60 30 Q90 14 130 20Z"
              stroke="#b8923a" strokeWidth="1" fill="none"/>
            <path d="M130 50 Q175 50 190 95 Q205 140 170 165 Q135 190 95 175 Q55 160 50 120 Q45 80 75 62 Q100 48 130 50Z"
              stroke="#b8923a" strokeWidth="0.7" fill="none"/>
          </svg>
          <div>
            <div className="gc-card-logo">DANHOV</div>
            <div className="gc-card-tagline">Handcrafted in Los Angeles · Est. 1984</div>
          </div>
          <div className="gc-card-bottom">
            <div className="gc-card-amount">$500</div>
            <div className="gc-card-footer">
              <span>Gift Card</span>
              <span>Never Expires</span>
            </div>
          </div>
        </div>

        {/* Selector */}
        <div className="gc-selector">
          <span className="gc-selector-label">Select an amount</span>
          <div className="gc-amounts">
            {AMOUNTS.map((a) => (
              <button key={a} className={`gc-amount-btn${a === 500 ? ' active' : ''}`}>
                ${a.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="gc-custom">
            <input
              className="gc-custom-input"
              type="number"
              placeholder="Custom amount (e.g. $750)"
              min="50"
              step="25"
            />
          </div>

          {/* Recipient details */}
          <div className="gc-form">
            <div className="gc-form-row">
              <div className="gc-form-group">
                <label>Recipient Name</label>
                <input type="text" placeholder="Their name" />
              </div>
              <div className="gc-form-group">
                <label>Recipient Email</label>
                <input type="email" placeholder="their@email.com" />
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-group">
                <label>Your Name</label>
                <input type="text" placeholder="Your name" />
              </div>
              <div className="gc-form-group">
                <label>Send On</label>
                <input type="date" />
              </div>
            </div>
            <div className="gc-form-group">
              <label>Personal Message (optional)</label>
              <textarea placeholder="Add a message to include with the gift card…" />
            </div>
          </div>
          <button className="gc-buy-btn">Purchase Gift Card — $500</button>
        </div>
      </section>

      {/* How it works */}
      <section className="gc-how">
        <div className="gc-how-inner">
          <p className="gc-section-label">How It Works</p>
          <h2 className="gc-section-title">Simple, beautiful, instant</h2>
          <div className="gc-steps">
            <div className="gc-step">
              <span className="gc-step-num">01</span>
              <p className="gc-step-title">Choose an amount</p>
              <p className="gc-step-body">Select from our curated amounts or enter a custom value. Any amount from $50 is accepted.</p>
            </div>
            <div className="gc-step">
              <span className="gc-step-num">02</span>
              <p className="gc-step-title">Delivered by email</p>
              <p className="gc-step-body">A beautiful digital card is emailed instantly — or scheduled for a specific date, like a birthday or anniversary.</p>
            </div>
            <div className="gc-step">
              <span className="gc-step-num">03</span>
              <p className="gc-step-title">Redeemed at checkout</p>
              <p className="gc-step-body">Apply the gift card code at checkout toward any piece — engagement rings, wedding bands, or a custom commission.</p>
            </div>
            <div className="gc-step">
              <span className="gc-step-num">04</span>
              <p className="gc-step-title">Never expires</p>
              <p className="gc-step-body">DANHOV gift cards carry no expiration date and no hidden fees. The value is yours until it is spent.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fine print */}
      <div className="gc-fine">
        <p>
          Gift cards are non-refundable and cannot be exchanged for cash.
          Balances roll over and never expire. Questions? Contact us at{' '}
          <a href="mailto:care@danhov.com">care@danhov.com</a> or call{' '}
          <a href="tel:+18883264687">(888) 326-4687</a>.
        </p>
      </div>
    </main>
  );
}
