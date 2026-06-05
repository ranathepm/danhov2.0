'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'danhov:wishlist:v1';

type WishlistCtx = {
  slugs: Set<string>;
  toggle: (slug: string) => void;
  loading: boolean;
};

const Ctx = createContext<WishlistCtx>({ slugs: new Set(), toggle: () => {}, loading: false });

export function useWishlist() { return useContext(Ctx); }

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Hydrate from localStorage on mount (same pattern as CartProvider)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed)) setSlugs(new Set(parsed));
      }
    } catch {}
  }, []);

  // Cross-tab sync via storage events
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed: string[] = JSON.parse(e.newValue ?? '[]');
        if (Array.isArray(parsed)) setSlugs(new Set(parsed));
      } catch {}
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback((slug: string) => {
    setLoading(true);
    setSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
    setLoading(false);
  }, []);

  return <Ctx.Provider value={{ slugs, toggle, loading }}>{children}</Ctx.Provider>;
}
