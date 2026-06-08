'use client';
import { useEffect } from 'react';

// Fires once on homepage mount and smooth-scrolls to the URL hash.
// Needed when navigating cross-page (e.g. /story → /#wedding-bands) because
// Next.js client-side navigation doesn't replay the browser's native hash scroll.
export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (++attempts < 12) {
        setTimeout(tryScroll, 150);
      }
    };
    // Give server-rendered sections time to paint before scrolling
    setTimeout(tryScroll, 120);
  }, []);
  return null;
}
