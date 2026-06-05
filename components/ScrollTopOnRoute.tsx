'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Forces the page to start at the top on every route change. Default
 * Next.js App Router preserves scroll position between renders, which
 * was causing the brief "footer flash" the client reported: the new
 * page rendered at the prior scroll y, briefly showing whatever was at
 * the bottom (the footer) before the rest of the content paint settled.
 *
 * Also disables the browser's manual scroll restoration so a refresh
 * never lands the user mid-page.
 */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ScrollTopOnRoute() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // Smooth scroll-behavior on body would visibly animate the
    // scroll-to-top — keep it off during navigation to make the jump
    // instant. globals.css applies `scroll-behavior: smooth` to html
    // generally; this temporary override is harmless if it's already set.
    document.documentElement.style.scrollBehavior = 'auto';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  // useLayoutEffect runs SYNCHRONOUSLY after DOM mutations but before
  // paint, so the scroll jump happens before the user can see the
  // prior-page footer.
  useIsoLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  // Belt + suspenders: also fire one more scroll after the next frame
  // for any content that lays out late (lazy images, web fonts).
  useEffect(() => {
    const id = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(id);
  }, [pathname, searchParams]);

  return null;
}
