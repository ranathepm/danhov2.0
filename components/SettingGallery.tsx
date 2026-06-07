'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Props = {
  images: string[];
  name: string;
  // Controlled mode — driven by parent (e.g. shape selection)
  activeIndex?: number;
  onActiveChange?: (idx: number) => void;
};

export default function SettingGallery({ images, name, activeIndex: controlledIdx, onActiveChange }: Props) {
  const thumbs = images.slice(0, 6);
  const hero = thumbs[0];

  const [internalIdx, setInternalIdx] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const tiltRef = useRef({ x: 0, y: 0 });
  const innerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIdx !== undefined;
  const active = isControlled ? (controlledIdx % Math.max(thumbs.length, 1)) : internalIdx;

  function setActive(idx: number) {
    if (isControlled) {
      onActiveChange?.(idx);
    } else {
      setInternalIdx(idx);
    }
  }

  function applyTilt(x: number, y: number) {
    tiltRef.current = { x, y };
    if (innerRef.current) {
      innerRef.current.style.transform =
        `rotateY(${x.toFixed(2)}deg) rotateX(${(-y).toFixed(2)}deg) scale(1.025)`;
    }
  }

  function resetTilt() {
    tiltRef.current = { x: 0, y: 0 };
    if (innerRef.current) {
      innerRef.current.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
      innerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
      setTimeout(() => {
        if (innerRef.current) innerRef.current.style.transition = '';
      }, 450);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2 * 7;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2 * 5;
    applyTilt(x, y);
  }

  if (!hero) {
    return (
      <div className="sd-gallery">
        <div className="sd-main-img">
          <div className="sd-img-placeholder">
            <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <circle cx="40" cy="40" r="28" stroke="#c9b8ad" strokeWidth="1" />
              <circle cx="40" cy="40" r="16" stroke="#c9b8ad" strokeWidth="0.6" />
              <circle cx="40" cy="12" r="4" fill="#c9b8ad" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const shown = thumbs[active] ?? hero;

  return (
    <div className="sd-gallery">
      <div
        ref={frameRef}
        className={`sd-main-img${hovering ? ' is-hovering' : ''}`}
        style={{ perspective: '900px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); resetTilt(); }}
      >
        <div ref={innerRef} className="sd-img-inner">
          <Image
            src={shown}
            alt={name}
            fill
            sizes="(max-width: 880px) 100vw, 580px"
            style={{ objectFit: 'contain' }}
            priority
            draggable={false}
          />
        </div>
        {hovering && (
          <div className="sd-tilt-hint" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Move to rotate
          </div>
        )}
      </div>

      {thumbs.length > 1 && (
        <div className="sd-thumbs">
          {thumbs.map((src, idx) => (
            <button
              key={src}
              type="button"
              className={`sd-thumb${active === idx ? ' is-active' : ''}`}
              onClick={() => setActive(idx)}
              aria-label={idx === 0 ? `View ${name} — main photo` : `View ${name} — angle ${idx + 1}`}
              aria-pressed={active === idx}
            >
              <Image src={src} alt="" fill sizes="140px" style={{ objectFit: 'contain' }} loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
