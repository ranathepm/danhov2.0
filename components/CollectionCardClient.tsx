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
};

export default function CollectionCardClient({
  href,
  images,
  label,
  meaning,
  body,
  linkLabel,
  customSvg,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (images.length <= 1) return;
    setActiveIdx(1); // advance immediately so the first switch is instant
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
      className="cat-card"
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              style={{
                objectFit: 'contain',
                padding: '12px',
                mixBlendMode: 'multiply',
                opacity: i === activeIdx ? 1 : 0,
                transition: 'opacity 0.45s ease',
                zIndex: i === activeIdx ? 1 : 0,
              }}
              priority={i === 0}
            />
          ))
        ) : (
          <div className="cat-photo-placeholder">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <circle cx="40" cy="40" r="30" stroke="#AC3438" strokeWidth="5" fill="none" />
              <circle cx="40" cy="26" r="5" fill="rgba(172,52,56,0.12)" stroke="#AC3438" strokeWidth="0.5" />
            </svg>
          </div>
        )}
      </div>
      <div className="cat-info">
        <span className="cat-eyebrow">{label}</span>
        <p className="cat-meaning">{meaning}</p>
        <p className="cat-body">{body}</p>
        <span className="cat-link">{linkLabel} &rarr;</span>
      </div>
    </Link>
  );
}
