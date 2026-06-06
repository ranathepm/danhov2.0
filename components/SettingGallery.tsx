'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// ── Setting gallery: single-image 360° spin viewer ───────────────────────
// DANHOV product shoots aren't true turntable sequences, so cutting between
// the handful of real angle photos on hover just reads as the picture
// "jumping" between different shots. Instead, the single photo on display
// performs a smooth, continuous 360° spin on hover — the classic luxury
// product-viewer language — with a soft light glint that tracks the
// rotation, plus drag-to-rotate for hands-on control. The angle is written
// straight to the DOM via refs each frame so the spin stays buttery at
// 60fps without round-tripping through React state on every tick.

type Props = {
  images: string[];
  name: string;
};

const DEG_PER_SECOND = 36; // 10s per revolution — slow, deliberate "turntable" pace
const DEG_PER_PIXEL = 0.6;

export default function SettingGallery({ images, name }: Props) {
  const thumbs = images.slice(0, 4);
  const hero = thumbs[0];
  const canSpin = !!hero;

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(0);
  const dragRef = useRef({ startX: 0, startAngle: 0 });
  const rafRef = useRef<number | null>(null);

  function applyAngle(deg: number) {
    angleRef.current = deg;
    const rad = (deg * Math.PI) / 180;

    // A single-axis rotateY reads as "the picture is being skewed" — what
    // sells an object as genuinely turning in space is *layered* motion:
    // a slight counter-tilt on the other axis, and real depth travel
    // (translateZ) so the piece swells toward camera as it faces you and
    // recedes as it turns away. Combined with the perspective on the
    // parent, this is what gives the spin actual volume.
    const tilt = Math.sin(rad * 1.7) * 4;
    const depth = Math.cos(rad) * 34;
    const scale = 1 + Math.cos(rad) * 0.045;
    if (stageRef.current) {
      stageRef.current.style.transform =
        `rotateX(${tilt.toFixed(2)}deg) rotateY(${deg.toFixed(2)}deg) translateZ(${depth.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    }
    if (sheenRef.current) {
      // A specular highlight that sweeps and flares as facets/metal catch
      // a fixed studio light while the piece rotates through it — brightest
      // and tightest face-on, broad and dim edge-on, just like a real turn.
      const facing = Math.max(0, Math.cos(rad));
      const x = 50 + Math.sin(rad) * 40;
      const spread = 70 - facing * 28;
      const glow = 0.05 + facing * facing * 0.22;
      sheenRef.current.style.background =
        `radial-gradient(ellipse ${spread.toFixed(0)}% ${(spread * 1.1).toFixed(0)}% at ${x.toFixed(1)}% 40%, rgba(255,255,255,${glow.toFixed(3)}), transparent 62%)`;
    }
  }

  // Smooth continuous rotation while hovering (and not actively dragged) —
  // always resumes from the photo's current angle, so starting, stopping,
  // and grabbing the image mid-spin never causes a visual jump.
  useEffect(() => {
    if (!hovering || dragging || !canSpin) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      applyAngle(angleRef.current + DEG_PER_SECOND * dt);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [hovering, dragging, canSpin]);

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
    dragRef.current = { startX: e.clientX, startAngle: angleRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    applyAngle(dragRef.current.startAngle + dx * DEG_PER_PIXEL);
  }
  function handlePointerUp() {
    setDragging(false);
  }

  function selectThumb(idx: number) {
    setActive(idx);
    applyAngle(0);
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
        className={`sd-main-img${canSpin ? ' is-spinnable' : ''}${dragging ? ' is-dragging' : ''}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div ref={stageRef} className="sd-spin-stage">
          <div className="sd-spin-face">
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
          {/* Mirrored stand-in for the far side — DANHOV doesn't shoot a
              true back-view photo, and a mirrored front reads as a
              plausible reverse for a roughly-symmetric solitaire band. */}
          <div className="sd-spin-face is-back" aria-hidden="true">
            <Image
              src={shown}
              alt=""
              fill
              sizes="(max-width: 880px) 100vw, 580px"
              style={{ objectFit: 'contain' }}
              draggable={false}
            />
          </div>
        </div>
        {canSpin && <div ref={sheenRef} className="sd-spin-sheen" aria-hidden="true" />}

        {canSpin && (
          <div className={`sd-360-badge${hovering ? ' is-active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
            </svg>
            <span>{dragging ? 'Drag to rotate' : hovering ? 'Spinning · drag to steer' : '360° View'}</span>
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
              onClick={() => selectThumb(idx)}
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
