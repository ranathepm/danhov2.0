'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

// ── Data ────────────────────────────────────────────────────────────────────

const LIFE_PATH_DATA: Record<number, { title: string; desc: string; element: string }> = {
  1: {
    title: 'The Leader',
    desc: 'You are a trailblazer — independent, driven, and born to chart your own course. Your life path is one of originality and courage. You lead not by demand but by example, creating the road as you walk it.',
    element: 'Fire',
  },
  2: {
    title: 'The Peacemaker',
    desc: 'You are the quiet force — intuitive, gentle, and deeply attuned to others. Your path is one of harmony, partnership, and the sacred art of balance. You hold space for others like no one else can.',
    element: 'Water',
  },
  3: {
    title: 'The Creator',
    desc: 'You are expression incarnate — vibrant, imaginative, and endlessly creative. Your life path is one of joy, beauty, and the power of words. When you speak or create, something shifts.',
    element: 'Air',
  },
  4: {
    title: 'The Builder',
    desc: 'You are the foundation — disciplined, reliable, and built for the long game. Your path is one of craft, structure, and quiet mastery. You create things that endure long after you are gone.',
    element: 'Earth',
  },
  5: {
    title: 'The Free',
    desc: 'You are movement itself — adventurous, sensual, and endlessly curious. Your life path is one of freedom, experience, and the thrill of the unknown. You are never finished becoming.',
    element: 'Ether',
  },
  6: {
    title: 'The Nurturer',
    desc: 'You are love in action — caring, responsible, and devoted to those you hold close. Your path is one of service, beauty, and the sacred art of home. You make everywhere feel like belonging.',
    element: 'Earth',
  },
  7: {
    title: 'The Seeker',
    desc: 'You are the mystic — introspective, analytical, and drawn to the unseen. Your life path is one of inner truth, spiritual depth, and the questions that have no easy answers. You search beautifully.',
    element: 'Water',
  },
  8: {
    title: 'The Achiever',
    desc: 'You are power made tangible — ambitious, magnetic, and born to succeed. Your path is one of mastery, authority, and the wisdom that comes from knowing what you are truly worth.',
    element: 'Fire',
  },
  9: {
    title: 'The Humanitarian',
    desc: 'You are the most evolved of all the numbers — compassionate, wise, and drawn to all of humanity. Your life path is one of completion, letting go, and giving everything you have learned back to the world.',
    element: 'Air',
  },
  11: {
    title: 'The Visionary',
    desc: 'You carry a master number — rare and luminous. Yours is a path of spiritual awakening, intuitive power, and the calling to illuminate something larger than yourself. You are here to inspire.',
    element: 'Light',
  },
  22: {
    title: 'The Master Builder',
    desc: 'You carry the highest master number — a path of extraordinary potential. You have the vision of the 11 and the grounded power of the 4. You are here to build something that will outlast you.',
    element: 'All',
  },
};

const ZODIAC_DATA = [
  { sign: 'Capricorn', symbol: '♑', dates: 'Dec 22 – Jan 19', desc: 'Disciplined. Ambitious. Enduring.' },
  { sign: 'Aquarius',  symbol: '♒', dates: 'Jan 20 – Feb 18', desc: 'Original. Visionary. Free.' },
  { sign: 'Pisces',    symbol: '♓', dates: 'Feb 19 – Mar 20', desc: 'Intuitive. Compassionate. Mystical.' },
  { sign: 'Aries',     symbol: '♈', dates: 'Mar 21 – Apr 19', desc: 'Bold. Pioneering. Fearless.' },
  { sign: 'Taurus',    symbol: '♉', dates: 'Apr 20 – May 20', desc: 'Steadfast. Sensual. Devoted.' },
  { sign: 'Gemini',    symbol: '♊', dates: 'May 21 – Jun 20', desc: 'Curious. Expressive. Dual-natured.' },
  { sign: 'Cancer',    symbol: '♋', dates: 'Jun 21 – Jul 22', desc: 'Nurturing. Protective. Deeply feeling.' },
  { sign: 'Leo',       symbol: '♌', dates: 'Jul 23 – Aug 22', desc: 'Radiant. Generous. Born to lead.' },
  { sign: 'Virgo',     symbol: '♍', dates: 'Aug 23 – Sep 22', desc: 'Precise. Devoted. Quietly powerful.' },
  { sign: 'Libra',     symbol: '♎', dates: 'Sep 23 – Oct 22', desc: 'Harmonious. Just. Endlessly graceful.' },
  { sign: 'Scorpio',   symbol: '♏', dates: 'Oct 23 – Nov 21', desc: 'Intense. Transformative. Unforgettable.' },
  { sign: 'Sagittarius', symbol: '♐', dates: 'Nov 22 – Dec 21', desc: 'Expansive. Truthful. Forever seeking.' },
];

// ── Calculations ─────────────────────────────────────────────────────────────

function calcLifePath(day: number, month: number, year: number): number {
  const str = `${day}${month}${year}`;
  let sum = str.split('').reduce((acc, d) => acc + Number(d), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = String(sum).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return sum;
}

function getZodiac(day: number, month: number) {
  const n = month * 100 + day;
  if (n >= 1222 || n <= 119) return ZODIAC_DATA[0];  // Capricorn
  if (n <= 218) return ZODIAC_DATA[1];  // Aquarius
  if (n <= 320) return ZODIAC_DATA[2];  // Pisces
  if (n <= 419) return ZODIAC_DATA[3];  // Aries
  if (n <= 520) return ZODIAC_DATA[4];  // Taurus
  if (n <= 620) return ZODIAC_DATA[5];  // Gemini
  if (n <= 722) return ZODIAC_DATA[6];  // Cancer
  if (n <= 822) return ZODIAC_DATA[7];  // Leo
  if (n <= 922) return ZODIAC_DATA[8];  // Virgo
  if (n <= 1022) return ZODIAC_DATA[9]; // Libra
  if (n <= 1121) return ZODIAC_DATA[10]; // Scorpio
  return ZODIAC_DATA[11]; // Sagittarius
}

// ── Geometric design SVG ─────────────────────────────────────────────────────

function LifePathDesign({ num }: { num: number }) {
  const cx = 140, cy = 140;

  const pts = (count: number, r: number, startAngle = -Math.PI / 2) =>
    Array.from({ length: count }, (_, i) => {
      const a = startAngle + (2 * Math.PI * i / count);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

  const polyStr = (count: number, r: number, startAngle = -Math.PI / 2) =>
    pts(count, r, startAngle).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  // Generate all star polygon paths (handles even n by producing 2 triangles etc.)
  function starPaths(count: number, r: number, skip = 2): string[] {
    const v = pts(count, r);
    const paths: string[] = [];
    const visited = new Set<number>();
    for (let start = 0; start < count; start++) {
      if (visited.has(start)) continue;
      const chain: number[] = [];
      let cur = start;
      do {
        chain.push(cur);
        visited.add(cur);
        cur = (cur + skip) % count;
      } while (cur !== start);
      paths.push(
        'M ' + chain.map(i => `${v[i].x.toFixed(2)} ${v[i].y.toFixed(2)}`).join(' L ') + ' Z'
      );
    }
    return paths;
  }

  const n = num === 22 ? 4 : num === 11 ? 11 : Math.max(1, Math.min(num, 9));
  const spokePts = pts(n === 1 ? 4 : n, 88);

  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer ring band */}
      <circle cx={cx} cy={cy} r={118} stroke="#AC3438" strokeWidth="1.8"/>
      <circle cx={cx} cy={cy} r={93}  stroke="#AC3438" strokeWidth="1"   opacity="0.5"/>

      {/* Radial spokes */}
      {spokePts.map((p, i) => (
        <line key={i}
          x1={cx} y1={cy}
          x2={p.x.toFixed(2)} y2={p.y.toFixed(2)}
          stroke="#AC3438" strokeWidth="0.7" opacity="0.3"
        />
      ))}

      {/* Main polygon — skip for 1 and 2 which use special designs */}
      {n >= 3 && (
        <polygon
          points={polyStr(n, 58)}
          stroke="#AC3438" strokeWidth="1.3" fill="none" opacity="0.75"
        />
      )}

      {/* Star polygon for n >= 5 */}
      {n >= 5 && starPaths(n, 72, 2).map((d, i) => (
        <path key={i} d={d} stroke="#AC3438" strokeWidth="1" fill="none" opacity="0.45"/>
      ))}

      {/* Number 22: double square (rotated 45°) */}
      {num === 22 && (
        <polygon
          points={polyStr(4, 58, -Math.PI / 4)}
          stroke="#AC3438" strokeWidth="1" fill="none" opacity="0.5"
        />
      )}

      {/* Number 2: vesica piscis */}
      {num === 2 && (
        <>
          <circle cx={cx - 20} cy={cy} r={34} stroke="#AC3438" strokeWidth="1.2" opacity="0.7"/>
          <circle cx={cx + 20} cy={cy} r={34} stroke="#AC3438" strokeWidth="1.2" opacity="0.7"/>
        </>
      )}

      {/* Number 1: simple cross + emphasis circle */}
      {num === 1 && (
        <>
          <circle cx={cx} cy={cy} r={48} stroke="#AC3438" strokeWidth="1.2" opacity="0.5"/>
          <line x1={cx} y1={cy - 93} x2={cx} y2={cy + 93} stroke="#AC3438" strokeWidth="0.7" opacity="0.3"/>
          <line x1={cx - 93} y1={cy} x2={cx + 93} y2={cy} stroke="#AC3438" strokeWidth="0.7" opacity="0.3"/>
        </>
      )}

      {/* Inner concentric accent */}
      <circle cx={cx} cy={cy} r={28} stroke="#AC3438" strokeWidth="0.8" opacity="0.4"/>

      {/* Center stone */}
      <circle cx={cx} cy={cy} r={16} stroke="#AC3438" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={6}  fill="#AC3438" opacity="0.3"/>

      {/* Life path number */}
      <text
        x={cx} y={cy + 5}
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif"
        fontSize="14"
        fill="#AC3438"
        opacity="0.5"
      >
        {num}
      </text>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Screen = 'landing' | 'input' | 'results';

interface ResultData {
  lifePathNum: number;
  zodiac: (typeof ZODIAC_DATA)[number];
  birthDate: string;
}

export default function LifePathClient() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);

  const lpData = result ? (LIFE_PATH_DATA[result.lifePathNum] ?? LIFE_PATH_DATA[9]) : null;

  function handleReveal() {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2025) {
      setError('Please enter a valid date of birth.');
      return;
    }
    setError('');

    const num = calcLifePath(d, m, y);
    const zodiac = getZodiac(d, m);
    setResult({ lifePathNum: num, zodiac, birthDate: `${d}/${m}/${y}` });
    setScreen('results');
  }

  function handleReset() {
    setDay(''); setMonth(''); setYear('');
    setResult(null);
    setError('');
    setScreen('input');
  }

  return (
    <main className="lp-page">
      <style>{`
        /* ── Page shell ── */
        .lp-page {
          min-height: 100vh;
          font-family: 'Jost', sans-serif;
        }

        /* ── Landing ── */
        .lp-landing {
          min-height: 100vh;
          background: #1a1410;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-landing-bg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          opacity: 0.12;
        }
        .lp-landing-bg svg { width: min(560px, 90vw); }
        .lp-landing-nav {
          position: absolute;
          top: 24px;
          left: 24px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(250,246,241,0.5);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
          z-index: 2;
        }
        .lp-landing-nav:hover { color: #faf6f1; }
        .lp-landing-inner {
          position: relative;
          z-index: 1;
          max-width: 520px;
        }
        .lp-landing-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 24px;
        }
        .lp-landing-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 7vw, 72px);
          font-weight: 300;
          color: #faf6f1;
          margin: 0 0 20px;
          line-height: 1.05;
          letter-spacing: 0.04em;
        }
        .lp-landing-divider {
          width: 40px;
          height: 1px;
          background: #AC3438;
          margin: 0 auto 20px;
        }
        .lp-landing-sub {
          font-size: 15px;
          color: rgba(250,246,241,0.6);
          line-height: 1.7;
          margin: 0 0 44px;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }
        .lp-landing-btn {
          display: inline-block;
          padding: 16px 56px;
          background: #AC3438;
          color: #faf6f1;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          font-family: 'Jost', sans-serif;
          transition: background 0.2s;
        }
        .lp-landing-btn:hover { background: #8f2b2e; }

        /* ── Input screen ── */
        .lp-input {
          min-height: 100vh;
          background: #faf6f1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
        }
        .lp-input-back {
          position: absolute;
          top: 24px;
          left: 24px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8f86;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          font-family: 'Jost', sans-serif;
        }
        .lp-input-back:hover { color: #1a1410; }
        .lp-input-inner { max-width: 420px; width: 100%; }
        .lp-input-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 20px;
        }
        .lp-input-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 5vw, 46px);
          font-weight: 400;
          color: #1a1410;
          margin: 0 0 8px;
          line-height: 1.1;
        }
        .lp-input-sub {
          font-size: 13.5px;
          color: #8a7f76;
          margin: 0 0 40px;
          line-height: 1.6;
        }
        .lp-date-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          gap: 12px;
          margin-bottom: 8px;
        }
        .lp-date-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }
        .lp-date-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9c8f86;
        }
        .lp-date-input {
          width: 100%;
          padding: 14px 12px;
          background: #fff;
          border: 1px solid #ede8e2;
          font-size: 16px;
          font-family: 'Cormorant Garamond', serif;
          color: #1a1410;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .lp-date-input:focus { border-color: #AC3438; }
        .lp-date-input::placeholder { color: #bdb0a8; }
        .lp-error {
          font-size: 12px;
          color: #AC3438;
          margin: 10px 0 0;
          min-height: 18px;
          text-align: left;
        }
        .lp-reveal-btn {
          width: 100%;
          margin-top: 28px;
          padding: 16px;
          background: #1a1410;
          color: #faf6f1;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lp-reveal-btn:hover { background: #AC3438; }

        /* ── Results screen ── */
        .lp-results {
          min-height: 100vh;
          background: #faf6f1;
          padding: 80px 24px 60px;
          position: relative;
        }
        .lp-results-back {
          position: absolute;
          top: 24px;
          left: 24px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8f86;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          font-family: 'Jost', sans-serif;
        }
        .lp-results-back:hover { color: #1a1410; }
        .lp-results-inner {
          max-width: 960px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: start;
        }
        .lp-results-left { position: sticky; top: 80px; }
        .lp-design-label {
          display: block;
          font-size: 9.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 20px;
          text-align: center;
        }
        .lp-design-svg-wrap {
          background: #fff;
          border: 1px solid #ede8e2;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .lp-design-svg-wrap svg { width: 100%; height: 100%; }

        .lp-results-right { padding-top: 12px; }
        .lp-number-eyebrow {
          display: block;
          font-size: 9.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 12px;
        }
        .lp-number-big {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(72px, 12vw, 110px);
          color: #AC3438;
          line-height: 1;
          margin: 0;
          display: block;
        }
        .lp-number-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 4vw, 34px);
          font-weight: 400;
          color: #1a1410;
          margin: 8px 0 0;
        }
        .lp-divider {
          width: 40px;
          height: 2px;
          background: #AC3438;
          margin: 20px 0;
        }
        .lp-number-desc {
          font-size: 14.5px;
          color: #6b5e57;
          line-height: 1.8;
          margin: 0 0 32px;
        }
        .lp-element-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
        }
        .lp-element-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9c8f86;
        }
        .lp-element-val {
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a1410;
          font-weight: 500;
        }
        .lp-element-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #AC3438;
        }

        /* Zodiac card */
        .lp-zodiac-card {
          background: #1a1410;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }
        .lp-zodiac-symbol {
          font-size: 36px;
          color: #faf6f1;
          line-height: 1;
          flex-shrink: 0;
          font-family: 'Cormorant Garamond', serif;
        }
        .lp-zodiac-info {}
        .lp-zodiac-label {
          display: block;
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(250,246,241,0.5);
          margin-bottom: 4px;
        }
        .lp-zodiac-sign {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          color: #faf6f1;
          display: block;
          line-height: 1;
          margin-bottom: 4px;
        }
        .lp-zodiac-dates {
          font-size: 11px;
          color: rgba(250,246,241,0.45);
          display: block;
          margin-bottom: 6px;
        }
        .lp-zodiac-desc {
          font-size: 12px;
          color: rgba(250,246,241,0.65);
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }

        /* CTAs */
        .lp-ctas {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-cta-primary {
          display: block;
          width: 100%;
          padding: 16px;
          background: #AC3438;
          color: #faf6f1;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          text-align: center;
          border: none;
          transition: background 0.2s;
        }
        .lp-cta-primary:hover { background: #8f2b2e; }
        .lp-cta-secondary {
          display: block;
          width: 100%;
          padding: 15px;
          background: transparent;
          color: #1a1410;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-align: center;
          border: 1px solid #ede8e2;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .lp-cta-secondary:hover { border-color: #1a1410; }

        /* ── Responsive ── */
        @media (max-width: 720px) {
          .lp-results { padding: 60px 20px 40px; }
          .lp-results-inner {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .lp-results-left { position: static; }
          .lp-number-big { font-size: 80px; }
        }
      `}</style>

      {/* ── LANDING ── */}
      {screen === 'landing' && (
        <div className="lp-landing">
          <Link href="/engagement-rings" className="lp-landing-nav">
            ← Back to Rings
          </Link>
          <div className="lp-landing-bg" aria-hidden="true">
            <svg viewBox="0 0 600 600" fill="none">
              <circle cx="300" cy="300" r="280" stroke="#AC3438" strokeWidth="0.8"/>
              <circle cx="300" cy="300" r="220" stroke="#AC3438" strokeWidth="0.5" opacity="0.6"/>
              <circle cx="300" cy="300" r="165" stroke="#AC3438" strokeWidth="0.5" opacity="0.5"/>
              <circle cx="300" cy="300" r="115" stroke="#AC3438" strokeWidth="0.4" opacity="0.4"/>
              <circle cx="300" cy="300" r="72"  stroke="#AC3438" strokeWidth="0.4" opacity="0.3"/>
              <circle cx="300" cy="300" r="38"  stroke="#AC3438" strokeWidth="0.3" opacity="0.2"/>
              <line x1="300" y1="20"  x2="300" y2="580" stroke="#AC3438" strokeWidth="0.3" opacity="0.4"/>
              <line x1="20"  y1="300" x2="580" y2="300" stroke="#AC3438" strokeWidth="0.3" opacity="0.4"/>
              <line x1="95"  y1="95"  x2="505" y2="505" stroke="#AC3438" strokeWidth="0.25" opacity="0.3"/>
              <line x1="505" y1="95"  x2="95"  y2="505" stroke="#AC3438" strokeWidth="0.25" opacity="0.3"/>
              <polygon points="300,22 548,162 548,438 300,578 52,438 52,162" stroke="#AC3438" strokeWidth="0.4" fill="none" opacity="0.3"/>
            </svg>
          </div>
          <div className="lp-landing-inner">
            <span className="lp-landing-eyebrow">DANHOV · The Life Path</span>
            <h1 className="lp-landing-title">THE LIFE PATH</h1>
            <div className="lp-landing-divider"/>
            <p className="lp-landing-sub">
              Your birth date holds a number.<br />
              That number holds a ring.
            </p>
            <button className="lp-landing-btn" onClick={() => setScreen('input')}>
              Begin
            </button>
          </div>
        </div>
      )}

      {/* ── DATE INPUT ── */}
      {screen === 'input' && (
        <div className="lp-input" style={{ position: 'relative' }}>
          <button className="lp-input-back" onClick={() => setScreen('landing')}>
            ← Back
          </button>
          <div className="lp-input-inner">
            <span className="lp-input-eyebrow">Step 1 of 1</span>
            <h2 className="lp-input-title">When did you arrive?</h2>
            <p className="lp-input-sub">Enter your date of birth to reveal your life path number and original ring design.</p>

            <div className="lp-date-row">
              <div className="lp-date-field">
                <label className="lp-date-label" htmlFor="lp-day">Day</label>
                <input
                  id="lp-day"
                  type="number"
                  className="lp-date-input"
                  placeholder="DD"
                  min={1} max={31}
                  value={day}
                  onChange={e => setDay(e.target.value)}
                />
              </div>
              <div className="lp-date-field">
                <label className="lp-date-label" htmlFor="lp-month">Month</label>
                <input
                  id="lp-month"
                  type="number"
                  className="lp-date-input"
                  placeholder="MM"
                  min={1} max={12}
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                />
              </div>
              <div className="lp-date-field">
                <label className="lp-date-label" htmlFor="lp-year">Year</label>
                <input
                  id="lp-year"
                  type="number"
                  className="lp-date-input"
                  placeholder="YYYY"
                  min={1900} max={2025}
                  value={year}
                  onChange={e => setYear(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="lp-error">{error}</p>}

            <button className="lp-reveal-btn" onClick={handleReveal}>
              Reveal My Path
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {screen === 'results' && result && lpData && (
        <div className="lp-results">
          <button className="lp-results-back" onClick={() => setScreen('input')}>
            ← Recalculate
          </button>

          <div className="lp-results-inner">
            {/* Left: geometric ring design */}
            <div className="lp-results-left">
              <span className="lp-design-label">Your Original Design</span>
              <div className="lp-design-svg-wrap">
                <LifePathDesign num={result.lifePathNum} />
              </div>
            </div>

            {/* Right: life path info */}
            <div className="lp-results-right">
              <span className="lp-number-eyebrow">Life Path Number</span>
              <span className="lp-number-big">{result.lifePathNum}</span>
              <h2 className="lp-number-title">{lpData.title}</h2>
              <div className="lp-divider"/>
              <p className="lp-number-desc">{lpData.desc}</p>

              <div className="lp-element-row">
                <span className="lp-element-label">Element</span>
                <span className="lp-element-dot"/>
                <span className="lp-element-val">{lpData.element}</span>
              </div>

              {/* Zodiac card */}
              <div className="lp-zodiac-card">
                <span className="lp-zodiac-symbol">{result.zodiac.symbol}</span>
                <div className="lp-zodiac-info">
                  <span className="lp-zodiac-label">Zodiac Sign</span>
                  <span className="lp-zodiac-sign">{result.zodiac.sign}</span>
                  <span className="lp-zodiac-dates">{result.zodiac.dates}</span>
                  <span className="lp-zodiac-desc">{result.zodiac.desc}</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="lp-ctas">
                <Link
                  href={`/ring-builder/setting?lifePath=${result.lifePathNum}`}
                  className="lp-cta-primary"
                >
                  Commission This Design
                </Link>
                <button type="button" className="lp-cta-secondary" onClick={handleReset}>
                  Calculate Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
