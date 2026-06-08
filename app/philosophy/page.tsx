import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PhilosophySlider from '@/components/PhilosophySlider';
import TwelveInches from '@/components/TwelveInches';

export const metadata: Metadata = {
  title: 'Philosophy · The Truths Behind Every Ring · DANHOV',
  description:
    'The philosophy behind DANHOV — sacred geometry, spiritual teachings, and the founding truths that shape every handcrafted ring made in Los Angeles since 1984.',
  alternates: { canonical: '/philosophy' },
};

export default function PhilosophyPage() {
  return (
    <>
      {/* ── PAGE HERO ─────────────────────────────────────────────── */}
      <section className="phil-page-hero">
        <span className="section-eyebrow">The Philosophy</span>
        <h1 className="phil-page-title">
          Every ring carries<br /><em>a meaning.</em>
        </h1>
        <p className="phil-page-sub">
          In silence, the universe revealed its shape. These are the truths
          that guide every piece we make — from the first sketch to the last hallmark.
        </p>
      </section>

      {/* ── TRUTHS WE LIVE BY ─────────────────────────────────────── */}
      <PhilosophySlider />

      {/* ── 12 INCHES — MIND TO HEART ─────────────────────────────── */}
      <TwelveInches />

      {/* ── MARQUEE ───────────────────────────────────────────────── */}
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

      {/* ── SACRED GEOMETRY ───────────────────────────────────────── */}
      <section className="ring-section">
        <div className="ring-visual">
          <div className="ring-orbit" />
          <div className="ring-orbit" />
          <div className="ring-orbit" />
          <div className="ring-orbit" />
          <div className="ring-img-circle">
            <Image
              src="/triad-galaxy.png"
              alt="The Galaxy — DANHOV Abbraccio Swirl Ring"
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 768px) 80vw, 45vw"
            />
          </div>
        </div>
        <div className="ring-content">
          <span className="ring-eyebrow">The Signature Ring</span>
          <h2 className="ring-title">
            Sacred geometry,<br /><em>set in gold.</em>
          </h2>
          <p className="ring-body">
            Every DANHOV ring is handcrafted in Los Angeles using a spiral technique
            that mirrors the geometry of galaxies, seashells, and vortexes. When you
            wear this ring, you wear the signature of the universe itself.
          </p>
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
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/engagement-rings" className="btn-solid">Explore the Ring</Link>
            <Link href="/ring-builder" className="btn-primary">Build Yours</Link>
          </div>
        </div>
      </section>
    </>
  );
}
