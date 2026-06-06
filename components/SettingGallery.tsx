'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ── Setting gallery: functional 360°-style spin viewer ───────────────────
// DANHOV product shoots give us a handful of angle photos per setting
// (avg. ~6.5), not a true turntable frame sequence or a video. So instead
// of a static "360°" badge that does nothing, we drive an actual rotation
// illusion from the real photos: hovering auto-advances through the angles
// on a loop, and dragging lets the customer scrub through them by hand —
// exactly the interaction language of premium 360° viewers, built from the
// assets we actually have.

type Props = {
  images: string[];
  name: string;
};

const SPIN_INTERVAL_MS = 140;
const PX_PER_FRAME = 34;

export default function SettingGallery({ images, name }: Props) {
  const frames = images;
  const canSpin = frames.length > 1;

  const [frame, setFrame] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startFrame: 0 });
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate on hover (paused while the customer is dragging manually).
  useEffect(() => {
    if (hovering && !dragging && canSpin) {
      spinRef.current = setInterval(() => {
        setFrame((f) => (f + 1) % frames.length);
      }, SPIN_INTERVAL_MS);
    }
    return () => {
      if (spinRef.current) {
        clearInterval(spinRef.current);
        spinRef.current = null;
      }
    };
  }, [hovering, dragging, canSpin, frames.length]);

  function handleEnter() {
    setHovering(true);
  }
  function handleLeave() {
    setHovering(false);
    setDragging(false);
  }
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canSpin) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startFrame: frame };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !canSpin) return;
    const dx = e.clientX - dragRef.current.startX;
    const delta = Math.round(dx / PX_PER_FRAME);
    let next = (dragRef.current.startFrame - delta) % frames.length;
    if (next < 0) next += frames.length;
    setFrame(next);
  }
  function handlePointerUp() {
    setDragging(false);
  }

  if (frames.length === 0) {
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

  return (
    <div className="sd-gallery">
      <div
        className={`sd-main-img${canSpin ? ' is-spinnable' : ''}${dragging ? ' is-dragging' : ''}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {frames.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} — angle ${i + 1}`}
            fill
            sizes="(max-width: 880px) 100vw, 580px"
            style={{ objectFit: 'contain', opacity: i === frame ? 1 : 0 }}
            priority={i === 0}
            loading={i === 0 ? undefined : 'lazy'}
            draggable={false}
          />
        ))}

        {canSpin && (
          <div className={`sd-360-badge${hovering ? ' is-active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
            </svg>
            <span>{hovering ? 'Drag to rotate' : '360° View'}</span>
          </div>
        )}
      </div>

      {frames.length > 1 && (
        <div className="sd-thumbs">
          {frames.slice(1, 5).map((src, i) => {
            const idx = i + 1;
            return (
              <button
                key={src}
                type="button"
                className={`sd-thumb${frame === idx ? ' is-active' : ''}`}
                onClick={() => setFrame(idx)}
                aria-label={`View ${name} — angle ${idx + 1}`}
                aria-pressed={frame === idx}
              >
                <Image src={src} alt="" fill sizes="140px" style={{ objectFit: 'contain' }} loading="lazy" draggable={false} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
