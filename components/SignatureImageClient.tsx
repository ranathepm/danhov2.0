'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Props = {
  images: string[];
  href: string;
  alt: string;
};

export default function SignatureImageClient({ images, href, alt }: Props) {
  const defaultIdx = images.length >= 2 ? 1 : 0;
  const [activeIdx, setActiveIdx] = useState(defaultIdx);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCycle() {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % images.length);
    }, 1100);
  }

  function stopCycle() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setActiveIdx(defaultIdx);
  }

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  if (images.length === 0) {
    return (
      <Link href={href} className="sig-img-wrap" aria-label={`View ${alt}`}>
        <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="sig-ring-svg">
          <circle cx="120" cy="130" r="78" stroke="#8b2a2a" strokeWidth="1" opacity="0.3" fill="none" />
          <circle cx="120" cy="120" r="68" stroke="#AC3438" strokeWidth="14" fill="none" />
          <path d="M52 120 Q120 60 188 120" stroke="#8B2A2D" strokeWidth="0.5" fill="none" opacity="0.4" />
          <circle cx="120" cy="84" r="9" fill="#fffaf3" stroke="#AC3438" strokeWidth="0.5" />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
      aria-label={`View ${alt}`}
      onMouseEnter={startCycle}
      onMouseLeave={stopCycle}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={`${alt} — image ${i + 1}`}
          fill
          sizes="(max-width: 900px) 100vw, 55vw"
          style={{
            objectFit: 'cover',
            opacity: i === activeIdx ? 1 : 0,
            transition: 'opacity 0.55s ease',
            position: 'absolute',
            inset: 0,
          }}
          priority={i === 0}
          unoptimized={src.includes('.supabase.co') || src.includes('danhov.com') || src.endsWith('.gif')}
        />
      ))}
    </Link>
  );
}
