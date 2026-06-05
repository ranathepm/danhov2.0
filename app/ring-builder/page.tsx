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

      <section className="builder-cta">
        <Link href="/ring-builder/setting" className="btn-primary builder-cta-btn">
          Begin with the Setting →
        </Link>
        <p className="builder-cta-sub">
          Or speak with a specialist first — a private 30-minute consultation is just
          one click away.
        </p>
      </section>
    </main>
  );
}
