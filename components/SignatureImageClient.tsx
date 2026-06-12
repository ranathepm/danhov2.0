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
      className="sig-img-wrap"
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
          sizes="(max-width: 880px) 100vw, 50vw"
          style={{
            objectFit: 'contain',
            padding: '32px',
            mixBlendMode: 'multiply',
            opacity: i === activeIdx ? 1 : 0,
            transition: 'opacity 0.45s ease',
            position: 'absolute',
            inset: 0,
          }}
          priority={i === 0}
          unoptimized={src.includes('.supabase.co') || src.endsWith('.gif')}
        />
      ))}
    </Link>
  );
}
