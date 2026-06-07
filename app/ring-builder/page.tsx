import type { Metadata } from 'next';
import Link from 'next/link';
import BuilderStepper from '@/components/BuilderStepper';
import './builder.css';

export const metadata: Metadata = {
  title: 'Ring Builder · Design Your Own',
  description:
    'Design your own DANHOV engagement ring — choose the setting, then the diamond. Every piece handcrafted to order in Los Angeles, in 14k or 18k gold.',
  alternates: { canonical: '/ring-builder' },
};

export default function RingBuilderLandingPage() {
  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={false} />

      <section className="builder-hero">
        <span className="section-eyebrow">Create Your Ring</span>
        <h1 className="section-title">
          Design <em>your own</em>
        </h1>
        <p className="section-body">
          Four quiet steps. First, choose the setting that speaks to you — a swirl, a
          tension hold, a solitaire. Then choose your diamond. Then we begin.
        </p>
      </section>

      <section className="builder-intro-grid">
        <article className="builder-intro-card">
          <span className="builder-intro-step">01</span>
          <h3>Choose your setting</h3>
          <p>
            Browse our handcrafted settings — Abbraccio, Voltaggio, Classico, and more.
            Filter by metal and style.
          </p>
        </article>
        <article className="builder-intro-card">
          <span className="builder-intro-step">02</span>
          <h3>Choose your diamond</h3>
          <p>
            Pick your shape, carat, color, clarity and cut. Every diamond is GIA-graded,
            conflict-free and ethically traced.
          </p>
        </article>
        <article className="builder-intro-card">
          <span className="builder-intro-step">03</span>
          <h3>Complete your commission</h3>
          <p>
            We confirm the pairing, lock today&apos;s gold price for 24 hours, and a master
            jeweler in Los Angeles begins your piece.
          </p>
        </article>
      </section>

      {/* ── Three purchase paths ─────────────────────────────────── */}
      <section className="builder-paths">
        <p className="builder-paths-eyebrow">Choose how you&apos;d like to shop</p>
        <div className="builder-paths-grid">
          <article className="builder-path-card">
            <div className="builder-path-icon">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="13" stroke="#AC3438" strokeWidth="1.4" />
                <circle cx="20" cy="20" r="7" stroke="#AC3438" strokeWidth="0.8" />
                <circle cx="20" cy="7" r="2.5" fill="#AC3438" />
              </svg>
            </div>
            <h3>Build a Complete Ring</h3>
            <p>Choose your setting, then pair it with a certified diamond. The classic commission path.</p>
            <Link href="/ring-builder/setting" className="builder-path-btn builder-path-btn--primary">
              Start with a Setting →
            </Link>
          </article>

          <article className="builder-path-card">
            <div className="builder-path-icon">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <circle cx="20" cy="20" r="13" stroke="#AC3438" strokeWidth="1.4" />
                <circle cx="20" cy="20" r="7" stroke="#AC3438" strokeWidth="0.8" />
              </svg>
            </div>
            <h3>Buy a Setting Alone</h3>
            <p>Purchase just the ring setting — handcrafted to your size and metal choice, without a diamond.</p>
            <Link href="/ring-builder/setting" className="builder-path-btn">
              Browse Settings →
            </Link>
          </article>

          <article className="builder-path-card">
            <div className="builder-path-icon">
              <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <polygon points="20,5 34,15 20,35 6,15" stroke="#AC3438" strokeWidth="1.4" fill="none" />
                <polyline points="6,15 20,22 34,15" stroke="#AC3438" strokeWidth="0.8" />
              </svg>
            </div>
            <h3>Buy a Loose Diamond</h3>
            <p>Select a GIA-graded diamond from live inventory. No setting required — a specialist will assist.</p>
            <Link href="/ring-builder/diamond" className="builder-path-btn">
              Browse Diamonds →
            </Link>
          </article>
        </div>
      </section>

      <section className="builder-cta">
        <p className="builder-cta-sub">
          Prefer to speak with a specialist first? A private 30-minute consultation is just
          one click away.
        </p>
      </section>
    </main>
  );
}
