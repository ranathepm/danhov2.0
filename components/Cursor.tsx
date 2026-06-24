'use client';

import { useEffect, useRef } from 'react';

export default function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function onMove(e: MouseEvent) {
      wrap!.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    }

    function onOver(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest('a, button, [data-dnh]')) {
        wrap!.classList.add('cursor--hover');
      }
    }

    function onOut(e: MouseEvent) {
      const target = e.relatedTarget as Element | null;
      if (!target || !target.closest('a, button, [data-dnh]')) {
        wrap!.classList.remove('cursor--hover');
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <div className="cursor-wrap" ref={wrapRef} aria-hidden="true">
      <svg
        className="cursor-icon"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="3.5" fill="#AC3438" />
        <circle cx="10" cy="10" r="8.5" stroke="#AC3438" strokeWidth="0.8" fill="none" opacity="0.45" />
      </svg>
    </div>
  );
}
