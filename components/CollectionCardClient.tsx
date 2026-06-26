'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Props = {
  href: string;
  images: string[];
  label: string;
  meaning: string;
  body: string;
  linkLabel: string;
  customSvg?: React.ReactNode;
  featured?: boolean; // true for Wedding/Fine/Mens — tall overlay cards
  editorial?: boolean; // true for engagement grid — image + text below
};

export default function CollectionCardClient({
  href,
  images,
  label,
  meaning,
  customSvg,
  featured = false,
  editorial = false,
}: Props) {
  const defaultIdx = editorial && images.length > 1 ? 1 : 0;
  const [activeIdx, setActiveIdx] = useState(defaultIdx);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (images.length <= 1) return;
    if (editorial) {
      const startFrom = images.length > 2 ? 2 : 0;
      setActiveIdx(startFrom);
      intervalRef.current = setInterval(() => {
        setActiveIdx((i) => {
          const next = i + 1;
          return next >= images.length ? 0 : next;
        });
      }, 1500);
    } else {
      setActiveIdx(1);
      intervalRef.current = setInterval(() => {
        setActiveIdx((i) => (i + 1) % images.length);
      }, 1500);
    }
  }

  function stopCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIdx(editorial && images.length > 1 ? 1 : 0);
  }

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (editorial) {
    return (
      <Link
        href={href}
        className="cat-editorial-card"
        onMouseEnter={startCycle}
        onMouseLeave={stopCycle}
      >
        <div className="cat-editorial-photo">
          {customSvg ? (
            <div className="cat-editorial-photo-placeholder">{customSvg}</div>
          ) : images.length > 0 ? (
            images.map((src, i) => (
              <div key={src} className={`img-slide${i === activeIdx ? ' img-slide--active' : ''}`}>
                <img
                  src={src}
                  alt={`${label} by DANHOV`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
                  loading="eager"
                />
              </div>
            ))
          ) : (
            <div className="cat-editorial-photo-placeholder">
              <svg width="60" height="60" viewBox="0 0 80 80" fill="none" aria-hidden>
                <circle cx="40" cy="40" r="28" stroke="#AC3438" strokeWidth="1.5" fill="none" opacity="0.5" />
              </svg>
            </div>
          )}
        </div>
        <div className="cat-editorial-text">
          <span className="cat-editorial-name">{label}</span>
          <span className="cat-editorial-meaning">{meaning}</span>
        </div>
      </Link>
    );
  }

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
            <div key={src} className={`img-slide${i === activeIdx ? ' img-slide--active' : ''}`}>
              <img
                src={src}
                alt={`${label} by DANHOV`}
                style={{
                  width: '100%', height: '100%',
                  objectFit: featured ? 'contain' : 'cover',
                  objectPosition: 'center',
                  padding: featured ? '4px' : '0',
                  display: 'block',
                  boxSizing: 'border-box',
                }}
                loading="eager"
              />
            </div>
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
