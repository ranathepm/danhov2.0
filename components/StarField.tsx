'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseSpeed: number;
  opacity: number;
  drift: number;
  angle: number;
  vx: number;
  vy: number;
}

const REPULSION_RADIUS = 110;
const REPULSION_FORCE  = 7;

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf   = 0;
    let stars: Star[] = [];

    const spawn = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.floor((w * h) / 4200);
      stars = Array.from({ length: count }, () => ({
        x:         Math.random() * w,
        y:         Math.random() * h,
        r:         Math.random() < 0.65 ? Math.random() * 1.2 + 0.5 : Math.random() * 2.6 + 1.4,
        baseSpeed: Math.random() * 0.55 + 0.18,
        opacity:   Math.random() * 0.5 + 0.35,
        drift:     (Math.random() - 0.5) * 0.28,
        angle:     Math.random() * Math.PI * 2,
        vx: 0,
        vy: 0,
      }));
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      spawn();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const mouse = mouseRef.current;

      for (const s of stars) {
        if (mouse) {
          const dx   = s.x - mouse.x;
          const dy   = s.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPULSION_RADIUS && dist > 0.5) {
            const strength = ((REPULSION_RADIUS - dist) / REPULSION_RADIUS) ** 2;
            s.vx += (dx / dist) * strength * REPULSION_FORCE;
            s.vy += (dy / dist) * strength * REPULSION_FORCE;
          }
        }

        s.vx *= 0.88;
        s.vy *= 0.88;

        s.angle += 0.008;
        s.x += s.drift + Math.sin(s.angle) * 0.18 + s.vx;
        s.y += -s.baseSpeed + s.vy;

        if (s.y < -4)    { s.y = h + 4; s.x = Math.random() * w; }
        if (s.y > h + 4)   s.y = -4;
        if (s.x < -4)      s.x = w + 4;
        if (s.x > w + 4)   s.x = -4;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140, 60, 70, ${s.opacity * 0.85})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => { mouseRef.current = null; };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
