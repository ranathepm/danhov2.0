'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  href: string;
  images: string[];
  label: string;
  meaning: string;
  body: string;
  linkLabel: string;
  customSvg?: React.ReactNode;
  featured?: boolean; // true for Wedding/Fine/Mens — taller cards
};

export default function CollectionCardClient({
  href,
  images,
  label,
  customSvg,
  featured = false,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (images.length <= 1) return;
    setActiveIdx(1);
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % images.length);
    }, 1100);
  }

  function stopCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIdx(0);
  }

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return (
    <Link
      href={href}
      className={`cat-card${featured ? ' cat-card--featured' : ''}`}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      {/* Photo layer */}
      <div className="cat-photo">
        {customSvg ? (
          <div className="cat-photo-placeholder">{customSvg}</div>
        ) : images.length > 0 ? (
          images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={`${label} by DANHOV`}
              fill
              sizes={featured
                ? '(max-width: 768px) 100vw, 33vw'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'}
              style={{
                objectFit: 'cover',
                opacity: i === activeIdx ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
              priority={i === 0}
              unoptimized={src.includes('.supabase.co') || src.includes('danhov.com') || src.endsWith('.gif')}
            />
          ))
        ) : (
          <div className="cat-photo-placeholder">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
              <circle cx="40" cy="40" r="30" stroke="#AC3438" strokeWidth="5" fill="none" />
              <circle cx="40" cy="26" r="5" fill="rgba(172,52,56,0.12)" stroke="#AC3438" strokeWidth="0.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Gradient overlay — always present, name + explore */}
      <div className="cat-overlay">
        <span className="cat-name">{label}</span>
        <span className="cat-explore">
          Explore
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  );
}
