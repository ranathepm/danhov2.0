'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero background — dark mystical sanctuary.
 *
 * Replaces the cold cosmic-warp + the over-bright cream variants with a
 * deep navy-to-warm-cocoa gradient seeded with golden motes that drift,
 * twinkle, and faintly orbit a centre point. The composition matches
 * the spiritual booking screen the client referenced — a sense of
 * being held inside a luminous space, not staring at the void.
 *
 * Notes on the maths:
 *  - Each mote has a slow drift PLUS a faint orbital pull toward centre
 *    so the field feels gathered rather than wandering off-screen.
 *  - Brightness is sine-modulated per particle ("breathing").
 *  - Two soft golden ring-glows in the canvas itself anchor the composition.
 */

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
  baseOpacity: number;
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let motes: Mote[] = [];
    let visible = true;

    const spawn = (w: number, h: number) => {
      // Particle count tuned down so the per-frame cost stays low on
      // mid-range hardware. ~50–80 motes on a typical laptop, capped.
      const count = Math.min(120, Math.floor((w * h) / 14000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.01,
        baseOpacity: 0.4 + Math.random() * 0.55,
      }));
    };

    const paintBackground = (w: number, h: number) => {
      // Deep mystical gradient: cocoa centre → wine-edge → near-black
      // corners. This is the "held space" the U Collection talks about.
      const grad = ctx.createRadialGradient(
        w / 2, h * 0.45, 0,
        w / 2, h * 0.5, Math.max(w, h) * 0.85
      );
      grad.addColorStop(0, '#3a2218');
      grad.addColorStop(0.4, '#241410');
      grad.addColorStop(0.85, '#100805');
      grad.addColorStop(1, '#070302');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Centre golden glow — like sunlight through cloud cover
      const centreGlow = ctx.createRadialGradient(
        w / 2, h * 0.5, 0,
        w / 2, h * 0.5, Math.min(w, h) * 0.5
      );
      centreGlow.addColorStop(0, 'rgba(238, 186, 102, 0.18)');
      centreGlow.addColorStop(0.4, 'rgba(218, 168, 80, 0.08)');
      centreGlow.addColorStop(1, 'rgba(218, 168, 80, 0)');
      ctx.fillStyle = centreGlow;
      ctx.fillRect(0, 0, w, h);

      // Subtle bottom uplight — adds depth, hints at a horizon
      const bottomGlow = ctx.createLinearGradient(0, h * 0.65, 0, h);
      bottomGlow.addColorStop(0, 'rgba(218, 168, 80, 0)');
      bottomGlow.addColorStop(1, 'rgba(218, 168, 80, 0.08)');
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, 0, w, h);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      spawn(canvas.width, canvas.height);
      paintBackground(canvas.width, canvas.height);
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h * 0.5;

      // Repaint each frame so particles don't smear
      paintBackground(w, h);

      for (const m of motes) {
        // Gentle pull toward centre so the field stays gathered.
        const dx = cx - m.x;
        const dy = cy - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pull = 0.001;
        m.vx += (dx / dist) * pull;
        m.vy += (dy / dist) * pull;

        // Mild friction so velocity doesn't run away
        m.vx *= 0.985;
        m.vy *= 0.985;

        m.x += m.vx;
        m.y += m.vy;
        m.phase += m.phaseSpeed;

        // Wrap (gentle teleport from edge)
        if (m.x < -20) m.x = w + 20;
        if (m.x > w + 20) m.x = -20;
        if (m.y < -20) m.y = h + 20;
        if (m.y > h + 20) m.y = -20;

        const breathe = (Math.sin(m.phase) + 1) / 2;
        const opacity = m.baseOpacity * (0.4 + 0.6 * breathe);

        // Larger soft halo
        const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 6);
        halo.addColorStop(0, `rgba(255, 226, 158, ${opacity * 0.9})`);
        halo.addColorStop(0.35, `rgba(232, 178, 88, ${opacity * 0.45})`);
        halo.addColorStop(1, 'rgba(232, 178, 88, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Bright pinpoint core
        ctx.fillStyle = `rgba(255, 246, 220, ${opacity})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Only continue the loop while the hero is in view. When the user
      // scrolls below the hero the IO callback flips `visible` to false
      // and we stop scheduling new frames — saves significant CPU.
      if (visible) {
        raf = requestAnimationFrame(draw);
      } else {
        raf = 0;
      }
    };

    // Pause the rAF loop while the hero is off-screen — the user can't
    // see it and the particle painting was burning CPU even on pages
    // far below the fold.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const wasVisible = visible;
          visible = e.isIntersecting;
          if (visible && !wasVisible && raf === 0) {
            // Re-start the loop when scrolling back to the hero
            raf = requestAnimationFrame(draw);
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    // Respect reduced-motion: paint one frame, then idle.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    if (reducedMotion) {
      visible = false;       // prevents the rAF loop from re-scheduling
      draw();                // single frame paint
    } else {
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
