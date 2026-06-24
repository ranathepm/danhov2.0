'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  {
    number: '01',
    quote: '"We are already whole."',
    note: 'You are not looking for your other half. You are already complete. Love is two whole people choosing each other — fully.',
    image: '/phil-1.png',
  },
  {
    number: '02',
    quote: '"Waves are the ocean."',
    note: 'You are not separate from life — you are life expressing itself. The wave does not end. It returns. As do we.',
    image: '/phil-2.png',
  },
  {
    number: '03',
    quote: '"The way out is to go in."',
    note: 'Every answer lives inside. Every exit from pain, confusion, lostness — is inward. In silence, the ring was formed.',
    image: '/phil-3.jpg',
  },
  {
    number: '04',
    quote: '"The longest journey is only 12 inches — from the mind to the heart."',
    note: '12 inches. That is the whole distance. The ring lives closer to the heart than to the mind. That is not an accident.',
    image: '/phil-4.jpg',
  },
  {
    number: '05',
    quote: '"Self love."',
    note: 'The most complete sentence. The most radical act. The ring you give yourself is as sacred as any given to you.',
    image: '/phil-5.jpg',
  },
  {
    number: '06',
    quote: '"You are the universe."',
    note: 'Not part of it. Not inside it. You are it. The same force that shaped galaxies, shaped you — through you — back to you.',
    image: '/phil-6.jpg',
  },
];

type Phase = 'in' | 'visible' | 'out';

export default function PhilosophySlider() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('in');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  useEffect(() => {
    clear();
    // delay so browser paints the "out" position before transitioning in
    timerRef.current = setTimeout(() => setPhase('visible'), 80);
    return clear;
  }, [index]);

  useEffect(() => {
    if (phase !== 'visible') return;
    clear();
    // stay for 4.8s then start exit
    timerRef.current = setTimeout(() => setPhase('out'), 4800);
    return clear;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'out') return;
    clear();
    // after exit transition (0.9s), advance to next slide
    timerRef.current = setTimeout(() => {
      setPhase('in');
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 900);
    return clear;
  }, [phase]);

  const slide = SLIDES[index];

  const textTranslate =
    phase === 'in' ? 'translateX(-110%)' :
    phase === 'visible' ? 'translateX(0)' :
    'translateX(110%)';

  const imgTranslate =
    phase === 'in' ? 'translateX(110%)' :
    phase === 'visible' ? 'translateX(0)' :
    'translateX(-110%)';

  const opacity = phase === 'visible' ? 1 : 0;
  const transition = phase === 'in'
    ? 'none'
    : 'transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.7s ease';

  return (
    <section className="phil-section">
      <div className="phil-header">
        <span className="section-eyebrow">Truths We Live By</span>
        <h2 className="section-title">The <em>philosophy</em> behind every ring</h2>
      </div>

      <div className="phil-stage">
        {/* Text — enters from left */}
        <div
          className="phil-text"
          style={{ transform: textTranslate, opacity, transition }}
        >
          <div className="message-quote">{slide.quote}</div>
          <div className="message-bar" />
          <p className="message-note">{slide.note}</p>
        </div>

        {/* Image — enters from right */}
        <div
          className="phil-img"
          style={{ transform: imgTranslate, opacity, transition }}
        >
          <Image
            src={slide.image}
            alt={slide.quote}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
