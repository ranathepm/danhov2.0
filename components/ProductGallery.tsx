'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

function SafeImage({
  src, alt, width, height, className, priority, sizes, fallbackSrc,
}: {
  src: string; alt: string; width: number; height: number;
  className?: string; priority?: boolean; sizes?: string; fallbackSrc?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  // Primary image failed — try the product's default image
  if (failed && fallbackSrc && !fallbackFailed) {
    return (
      <Image
        src={fallbackSrc} alt={alt} width={width} height={height}
        className={className} sizes={sizes}
        unoptimized={fallbackSrc.endsWith('.gif')}
        onError={() => setFallbackFailed(true)}
      />
    );
  }
  // Both failed — show branded SVG placeholder
  if (failed) return <div className="pg-placeholder">{PLACEHOLDER}</div>;

  return (
    <Image
      src={src} alt={alt} width={width} height={height}
      className={className} priority={priority} sizes={sizes}
      unoptimized={src.endsWith('.gif')}
      onError={() => setFailed(true)}
    />
  );
}

type Props = {
  images: string[];
  alt: string;
  collection?: string | null;
  /** Default product images used as fallback when a metal-specific image 404s. */
  fallbackImages?: string[];
};

const PLACEHOLDER = (
  <svg
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="40" cy="40" r="28" stroke="#AC3438" strokeWidth="1.5" />
    <circle cx="40" cy="40" r="18" stroke="rgba(172,52,56,0.5)" strokeWidth="1" />
    <circle cx="40" cy="40" r="8" stroke="#AC3438" strokeWidth="0.8" />
    <ellipse
      cx="40"
      cy="40"
      rx="36"
      ry="14"
      stroke="rgba(172,52,56,0.5)"
      strokeWidth="0.6"
      opacity="0.5"
    />
  </svg>
);

/**
 * Mejuri-style product gallery.
 *
 * Desktop (≥901px): every image rendered at full size, stacked vertically
 * in the left column. The right info column is sticky so it stays in view
 * while the customer scrolls through the photos.
 *
 * Mobile (≤900px): the same images switch to a horizontal scroll-snap
 * carousel, with a dot indicator. CSS-only, no JS needed for the scroll
 * itself; the dot indicator tracks the current image with an
 * IntersectionObserver.
 */
export default function ProductGallery({ images, alt, collection, fallbackImages }: Props) {
  const list = images.length > 0 ? images : [null];
  const railRef = useRef<HTMLDivElement>(null);
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);

  // Track which image is centered in the mobile carousel
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // pick the most-visible entry
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const idx = Number((best.target as HTMLElement).dataset.idx);
        if (!Number.isNaN(idx)) setActiveMobileIdx(idx);
      },
      { root: rail, threshold: [0.5, 0.75] }
    );
    rail
      .querySelectorAll<HTMLElement>('[data-idx]')
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [list.length]);

  function scrollToMobileIdx(idx: number) {
    const rail = railRef.current;
    if (!rail) return;
    const target = rail.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  return (
    <div className="pg-root">
      {/* Desktop: vertical stack */}
      <div className="pg-stack">
        {list.map((src, i) => (
          <div key={(src ?? 'placeholder') + i} className="pg-cell">
            {src ? (
              <SafeImage
                src={src}
                alt={`${alt} — image ${i + 1} of ${list.length}`}
                width={1200}
                height={1200}
                className="pg-img"
                priority={i === 0}
                sizes="(max-width: 900px) 100vw, 56vw"
                fallbackSrc={fallbackImages?.[i] ?? fallbackImages?.[0]}
              />
            ) : (
              <div className="pg-placeholder">{PLACEHOLDER}</div>
            )}
            {collection && i === 0 && (
              <span className="pg-badge">{collection}</span>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: horizontal scroll-snap rail */}
      <div className="pg-rail" ref={railRef}>
        {list.map((src, i) => (
          <div key={(src ?? 'm-placeholder') + i} className="pg-rail-cell" data-idx={i}>
            {src ? (
              <SafeImage
                src={src}
                alt={`${alt} — image ${i + 1} of ${list.length}`}
                width={900}
                height={900}
                className="pg-img"
                priority={i === 0}
                sizes="100vw"
                fallbackSrc={fallbackImages?.[i] ?? fallbackImages?.[0]}
              />
            ) : (
              <div className="pg-placeholder">{PLACEHOLDER}</div>
            )}
            {collection && i === 0 && (
              <span className="pg-badge">{collection}</span>
            )}
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <div className="pg-dots" role="tablist" aria-label="Product images">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeMobileIdx}
              aria-label={`View image ${i + 1} of ${list.length}`}
              className={`pg-dot${i === activeMobileIdx ? ' is-active' : ''}`}
              onClick={() => scrollToMobileIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
