'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Data ────────────────────────────────────────────────────────────────────

const LIFE_PATH_DATA: Record<number, { title: string; desc: string; element: string }> = {
  1: { title: 'The Origin',          desc: 'The first. The one who begins. You carry the energy of creation — new paths, new forms. Where others wait, you start.',                                                                      element: 'Fire'  },
  2: { title: 'The Union',           desc: 'The peacemaker. You understand that two can become one without either disappearing. You hold space. You bring together.',                                                                     element: 'Water' },
  3: { title: 'The Voice',           desc: 'The expresser. Joy moves through you and out into the world. You were made to create, to speak, to light up a room.',                                                                        element: 'Air'   },
  4: { title: 'The Foundation',      desc: 'The builder. Steady, grounded, real. You make things that last. The world rests on people like you.',                                                                                        element: 'Earth' },
  5: { title: 'The Free',            desc: 'The seeker of experience. Change is your element. You cannot be contained — and you were never meant to be.',                                                                                element: 'Ether' },
  6: { title: 'The Heart',           desc: 'The nurturer. Love is your language. You carry others, you tend, you hold. Home is wherever you are.',                                                                                       element: 'Earth' },
  7: { title: 'The Seeker',          desc: 'The one who goes inward. You are here to understand what cannot be seen. The way out, for you, was always in.',                                                                              element: 'Water' },
  8: { title: 'The Force',           desc: 'The one with power. You move things in the world. Strength held with intention. Build, lead, manifest.',                                                                                     element: 'Fire'  },
  9: { title: 'The Completion',      desc: 'The old soul. You carry all the others within you. You are here to give, to release, to love without holding.',                                                                              element: 'Air'   },
  11: { title: 'The Illuminator',    desc: 'A master number. The intuitive light. You see what others miss. You are a candle in a dark room — you make others see.',                                                                     element: 'Light' },
  22: { title: 'The Master Builder', desc: 'A master number. You can build the impossible. Vision and foundation in one. What you imagine, you can make real.',                                                                          element: 'All'   },
  33: { title: 'The Teacher of Love', desc: 'A master number. The rarest path. Pure compassion made form. You are here to love at a scale most never reach.',                                                                           element: 'All'   },
};

const ZODIAC_DATA = [
  { sign: 'Capricorn',   symbol: '♑', dates: 'Dec 22 – Jan 19', desc: 'The mountain climber. Patient, enduring, built for the long path. You reach summits others abandon.' },
  { sign: 'Aquarius',    symbol: '♒', dates: 'Jan 20 – Feb 18', desc: 'The water bearer. You see the future before it arrives. You belong to everyone and no one.' },
  { sign: 'Pisces',      symbol: '♓', dates: 'Feb 19 – Mar 20', desc: 'The two fish. You swim between worlds — the seen and the felt. The most intuitive of all.' },
  { sign: 'Aries',       symbol: '♈', dates: 'Mar 21 – Apr 19', desc: 'The ram. First of the zodiac. Courage in motion. You begin what others fear to start.' },
  { sign: 'Taurus',      symbol: '♉', dates: 'Apr 20 – May 20', desc: 'The bull. Grounded in the senses. You know the value of what is real, slow, and lasting.' },
  { sign: 'Gemini',      symbol: '♊', dates: 'May 21 – Jun 20', desc: 'The twins. Two minds, endless curiosity. You hold both sides of every truth at once.' },
  { sign: 'Cancer',      symbol: '♋', dates: 'Jun 21 – Jul 22', desc: 'The crab. You carry home within you. Soft inside, protected outside. You feel everything.' },
  { sign: 'Leo',         symbol: '♌', dates: 'Jul 23 – Aug 22', desc: 'The lion. Born to shine. The warmth of the sun lives in you. You light the way for others.' },
  { sign: 'Virgo',       symbol: '♍', dates: 'Aug 23 – Sep 22', desc: 'The maiden. The one who refines. You see what could be better and make it so. Devotion in detail.' },
  { sign: 'Libra',       symbol: '♎', dates: 'Sep 23 – Oct 22', desc: 'The scales. The seeker of balance and beauty. You restore harmony wherever you go.' },
  { sign: 'Scorpio',     symbol: '♏', dates: 'Oct 23 – Nov 21', desc: 'The scorpion. Depth and transformation. You are not afraid of the dark — you were forged there.' },
  { sign: 'Sagittarius', symbol: '♐', dates: 'Nov 22 – Dec 21', desc: 'The archer. The seeker of meaning. You aim beyond the horizon and trust the arrow.' },
];

// ── Calculations ─────────────────────────────────────────────────────────────

function calcLifePath(day: number, month: number, year: number): number {
  const str = `${day}${month}${year}`;
  let sum = str.split('').reduce((acc, d) => acc + Number(d), 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split('').reduce((acc, d) => acc + Number(d), 0);
  }
  return sum;
}

function getZodiac(day: number, month: number): { zodiac: (typeof ZODIAC_DATA)[number]; index: number } {
  const n = month * 100 + day;
  let i = 11;
  if (n >= 1222 || n <= 119) i = 0;
  else if (n <= 218)  i = 1;
  else if (n <= 320)  i = 2;
  else if (n <= 419)  i = 3;
  else if (n <= 520)  i = 4;
  else if (n <= 620)  i = 5;
  else if (n <= 722)  i = 6;
  else if (n <= 822)  i = 7;
  else if (n <= 922)  i = 8;
  else if (n <= 1022) i = 9;
  else if (n <= 1121) i = 10;
  return { zodiac: ZODIAC_DATA[i], index: i };
}

function generateStory(lpTitle: string, zodiacSign: string): string {
  const inward = ['The Seeker', 'The Illuminator', 'The Foundation', 'The Union', 'The Completion'];
  const direction = inward.includes(lpTitle) ? 'turns inward' : 'opens outward';
  return `You are ${lpTitle} walking the path of ${zodiacSign}. A spiral that ${direction}, holding a single stone where the two energies meet. This form is yours alone — no other birth date makes it.`;
}

// ── Geometric design SVG ─────────────────────────────────────────────────────

function LifePathDesign({ num, zodiacIndex, day }: { num: number; zodiacIndex: number; day: number }) {
  const cx = 140, cy = 140, outerR = 100;

  // Clamp master numbers to geometric ranges
  const geoNum = num === 33 ? 6 : num === 22 ? 5 : num === 11 ? 4 : num;
  const innerR = 28 + geoNum * 4;          // 32–64 — always < outerR
  const petals = (geoNum % 8) + 4;         // 4–11 petals, unique per number
  const rotationDeg = zodiacIndex * 30;    // each zodiac sign rotates 30°
  const rings = (day % 4) + 2;             // 2–5 concentric rings based on birthday
  const centerR = Math.min(8 + geoNum, 18); // center stone 9–18px

  const spokes = Array.from({ length: petals }, (_, i) => {
    const rad = ((i / petals) * 360 + rotationDeg) * (Math.PI / 180);
    return {
      x1: (cx + Math.cos(rad) * innerR).toFixed(2),
      y1: (cy + Math.sin(rad) * innerR).toFixed(2),
      x2: (cx + Math.cos(rad) * outerR).toFixed(2),
      y2: (cy + Math.sin(rad) * outerR).toFixed(2),
    };
  });

  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Outer boundary */}
      <circle cx={cx} cy={cy} r={120} stroke="#AC3438" strokeWidth="0.5" opacity="0.2"/>

      {/* Concentric rings — count driven by birth day */}
      {Array.from({ length: rings }, (_, i) => {
        const r = (innerR + (i * (outerR - innerR)) / rings).toFixed(2);
        const op = (0.35 - i * 0.06).toFixed(2);
        return <circle key={i} cx={cx} cy={cy} r={r} stroke="#AC3438" strokeWidth="0.6" fill="none" opacity={op}/>;
      })}

      {/* Radial spokes — count driven by life path number */}
      {spokes.map((p, i) => (
        <g key={i}>
          <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="#AC3438" strokeWidth="1" opacity="0.55"/>
          <circle cx={p.x2} cy={p.y2} r="3" fill="#AC3438" opacity="0.65"/>
        </g>
      ))}

      {/* Center stone */}
      <circle cx={cx} cy={cy} r={centerR} fill="#AC3438" opacity="0.18"/>
      <circle cx={cx} cy={cy} r={centerR} stroke="#AC3438" strokeWidth="1.5" fill="none"/>

      {/* Life path number */}
      <text
        x={cx} y={cy + 6}
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif"
        fontSize="18"
        fill="#faf6f1"
        opacity="0.85"
      >
        {num}
      </text>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type Screen = 'landing' | 'input' | 'results' | 'commission' | 'success';

interface ResultData {
  lifePathNum: number;
  zodiac: (typeof ZODIAC_DATA)[number];
  zodiacIndex: number;
  birthDate: string;
  day: number;
}

export default function LifePathClient() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [commName, setCommName] = useState('');
  const [commEmail, setCommEmail] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [commError, setCommError] = useState('');
  const [commSubmitting, setCommSubmitting] = useState(false);

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
    const { zodiac, index: zodiacIndex } = getZodiac(d, m);
    setResult({ lifePathNum: num, zodiac, zodiacIndex, birthDate: `${d}/${m}/${y}`, day: d });
    setScreen('results');
  }

  function handleReset() {
    setDay(''); setMonth(''); setYear('');
    setResult(null);
    setError('');
    setScreen('input');
  }

  async function handleCommissionSubmit() {
    if (!commName.trim()) { setCommError('Please enter your name.'); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(commEmail.trim())) { setCommError('Please enter a valid email address.'); return; }
    setCommError('');
    setCommSubmitting(true);
    const lpInfo = result && lpData
      ? `Life Path ${result.lifePathNum} — ${lpData.title} · ${result.zodiac.sign} · Born ${result.birthDate}`
      : '';
    try {
      const res = await fetch('/api/consultation/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: commName.trim(),
          customer_email: commEmail.trim().toLowerCase(),
          notes: [lpInfo, commMessage.trim()].filter(Boolean).join('\n\n'),
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setScreen('success');
    } catch {
      setCommError('Something went wrong. Please try again.');
    } finally {
      setCommSubmitting(false);
    }
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

        /* Design story + note */
        .lp-design-story {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 15px;
          color: #6b5e57;
          line-height: 1.75;
          text-align: center;
          margin: 20px 0 10px;
        }
        .lp-design-note {
          font-size: 11px;
          color: #b0a49c;
          letter-spacing: 0.08em;
          line-height: 1.6;
          text-align: center;
          font-style: italic;
        }

        /* Disclaimer */
        .lp-disclaimer {
          max-width: 600px;
          margin: 48px auto 0;
          padding-top: 32px;
          border-top: 1px solid #ede8e2;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 14px;
          color: #9c8f86;
          line-height: 1.75;
          text-align: center;
        }

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

        /* ── Commission screen ── */
        .lp-commission {
          min-height: 100vh;
          background: #faf6f1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px 60px;
          position: relative;
        }
        .lp-commission-back {
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
        .lp-commission-back:hover { color: #1a1410; }
        .lp-commission-inner { max-width: 480px; width: 100%; }
        .lp-commission-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 12px;
        }
        .lp-commission-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(26px, 4vw, 38px);
          font-weight: 400;
          color: #1a1410;
          margin: 0 0 8px;
          line-height: 1.1;
        }
        .lp-commission-sub {
          font-size: 13.5px;
          color: #8a7f76;
          margin: 0 0 32px;
          line-height: 1.65;
        }
        .lp-commission-context {
          background: #1a1410;
          padding: 16px 20px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .lp-commission-context-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          color: #AC3438;
          line-height: 1;
          flex-shrink: 0;
        }
        .lp-commission-context-info {}
        .lp-commission-context-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          color: #faf6f1;
          display: block;
        }
        .lp-commission-context-zodiac {
          font-size: 11px;
          color: rgba(250,246,241,0.5);
          letter-spacing: 0.08em;
        }
        .lp-form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
        }
        .lp-form-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9c8f86;
        }
        .lp-form-input, .lp-form-textarea {
          width: 100%;
          padding: 13px 14px;
          background: #fff;
          border: 1px solid #ede8e2;
          font-size: 14px;
          font-family: 'Jost', sans-serif;
          color: #1a1410;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .lp-form-input:focus, .lp-form-textarea:focus { border-color: #AC3438; }
        .lp-form-input::placeholder, .lp-form-textarea::placeholder { color: #c0b5ac; }
        .lp-form-textarea { resize: vertical; min-height: 96px; }
        .lp-form-error {
          font-size: 12px;
          color: #AC3438;
          margin: 8px 0 0;
          min-height: 18px;
        }
        .lp-submit-btn {
          width: 100%;
          margin-top: 24px;
          padding: 16px;
          background: #AC3438;
          color: #faf6f1;
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lp-submit-btn:hover:not(:disabled) { background: #8f2b2e; }
        .lp-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Success screen ── */
        .lp-success {
          min-height: 100vh;
          background: #1a1410;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          text-align: center;
        }
        .lp-success-inner { max-width: 480px; }
        .lp-success-icon {
          width: 56px;
          height: 56px;
          border: 1px solid #AC3438;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
          color: #AC3438;
          font-size: 22px;
        }
        .lp-success-eyebrow {
          display: block;
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: #AC3438;
          margin-bottom: 14px;
        }
        .lp-success-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 5vw, 48px);
          font-weight: 300;
          color: #faf6f1;
          margin: 0 0 16px;
          line-height: 1.1;
        }
        .lp-success-divider {
          width: 40px;
          height: 1px;
          background: #AC3438;
          margin: 0 auto 20px;
        }
        .lp-success-sub {
          font-size: 14px;
          color: rgba(250,246,241,0.6);
          line-height: 1.75;
          margin: 0 0 40px;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }
        .lp-success-back {
          display: inline-block;
          padding: 14px 48px;
          border: 1px solid rgba(250,246,241,0.25);
          color: rgba(250,246,241,0.7);
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .lp-success-back:hover { border-color: #faf6f1; color: #faf6f1; }

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
              Your number holds a meaning.<br />
              Not your fate — a mirror.
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
                <LifePathDesign num={result.lifePathNum} zodiacIndex={result.zodiacIndex} day={result.day} />
              </div>
              <p className="lp-design-story">
                &ldquo;{generateStory(lpData.title, result.zodiac.sign)}&rdquo;
              </p>
              <p className="lp-design-note">
                A unique form, generated from your number and sign. When you commission your piece, our jeweler will refine it by hand — in silence.
              </p>
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
                <button type="button" className="lp-cta-primary" onClick={() => setScreen('commission')}>
                  Commission This Design
                </button>
                <button type="button" className="lp-cta-secondary" onClick={handleReset}>
                  Calculate Another
                </button>
              </div>
            </div>
          </div>

          <p className="lp-disclaimer">
            Your number and your sign are not your fate. They are doorways — ways of looking at yourself you may not have tried. Take what resonates. Leave the rest. You remain a mystery to be discovered.
          </p>
        </div>
      )}

      {/* ── COMMISSION ── */}
      {screen === 'commission' && result && lpData && (
        <div className="lp-commission">
          <button className="lp-commission-back" onClick={() => setScreen('results')}>
            ← Back
          </button>
          <div className="lp-commission-inner">
            <span className="lp-commission-eyebrow">Private Commission</span>
            <h2 className="lp-commission-title">Commission Your<br/>Life Path Ring</h2>
            <p className="lp-commission-sub">
              Our atelier will handcraft a ring designed around your unique number.
              Leave your details and a DANHOV jeweler will reach out to begin.
            </p>

            <div className="lp-commission-context">
              <span className="lp-commission-context-num">{result.lifePathNum}</span>
              <div className="lp-commission-context-info">
                <span className="lp-commission-context-title">{lpData.title}</span>
                <span className="lp-commission-context-zodiac">
                  {result.zodiac.symbol} {result.zodiac.sign} · Element: {lpData.element}
                </span>
              </div>
            </div>

            <div className="lp-form-field">
              <label className="lp-form-label" htmlFor="comm-name">Your Name</label>
              <input
                id="comm-name"
                type="text"
                className="lp-form-input"
                placeholder="Full name"
                value={commName}
                onChange={e => setCommName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="lp-form-field">
              <label className="lp-form-label" htmlFor="comm-email">Email Address</label>
              <input
                id="comm-email"
                type="email"
                className="lp-form-input"
                placeholder="you@example.com"
                value={commEmail}
                onChange={e => setCommEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="lp-form-field">
              <label className="lp-form-label" htmlFor="comm-message">Message (optional)</label>
              <textarea
                id="comm-message"
                className="lp-form-textarea"
                placeholder="Any thoughts, preferences, or questions for our jeweler…"
                value={commMessage}
                onChange={e => setCommMessage(e.target.value)}
              />
            </div>

            {commError && <p className="lp-form-error">{commError}</p>}

            <button
              type="button"
              className="lp-submit-btn"
              disabled={commSubmitting}
              onClick={handleCommissionSubmit}
            >
              {commSubmitting ? 'Sending…' : 'Send Commission Request'}
            </button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {screen === 'success' && (
        <div className="lp-success">
          <div className="lp-success-inner">
            <div className="lp-success-icon">✓</div>
            <span className="lp-success-eyebrow">Request Received</span>
            <h2 className="lp-success-title">Your commission<br/>is on its way.</h2>
            <div className="lp-success-divider"/>
            <p className="lp-success-sub">
              A DANHOV jeweler will be in touch shortly to begin crafting your
              Life Path ring — made only for you.
            </p>
            <Link href="/engagement-rings" className="lp-success-back">
              Return to Rings
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
