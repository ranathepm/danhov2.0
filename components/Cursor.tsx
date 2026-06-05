'use client';

import { useEffect, useRef } from 'react';

export default function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function onMove(e: MouseEvent) {
      wrap!.style.transform = `translate(${e.clientX - 12}px, ${e.clientY - 16}px)`;
    }

    function onEnter() { wrap!.classList.add('cursor--hover'); }
    function onLeave() { wrap!.classList.remove('cursor--hover'); }

    window.addEventListener('mousemove', onMove, { passive: true });

    const targets = document.querySelectorAll('a, button, [data-dnh]');
    targets.forEach((t) => {
      t.addEventListener('mouseenter', onEnter);
      t.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      targets.forEach((t) => {
        t.removeEventListener('mouseenter', onEnter);
        t.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <div className="cursor-wrap" ref={wrapRef} aria-hidden="true">
      <svg
        className="cursor-icon"
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* round ring band */}
        <circle cx="12" cy="22" r="8.5" stroke="#AC3438" strokeWidth="1.4" />

        {/* stone — sits right on top of the ring */}
        <circle cx="12" cy="10" r="3.5" fill="#AC3438" />
      </svg>
    </div>
  );
}
