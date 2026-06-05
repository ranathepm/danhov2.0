'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Result = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  category: string;
  image: string | null;
  price_display: string | null;
};

type QuickLink = { href: string; label: string };

const QUICK_LINKS: QuickLink[] = [
  { href: '/engagement-rings', label: 'Engagement Rings' },
  { href: '/wedding-bands', label: 'Wedding Bands' },
  { href: '/fine-jewelry', label: 'Fine Jewelry' },
  { href: '/mens', label: "Men's Jewelry" },
  { href: '/u-collection', label: 'The U Collection' },
  { href: '/ring-builder', label: 'Build a Ring' },
  { href: '/faq', label: 'FAQ & Care' },
];

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
      setTouched(false);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setTouched(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        });
        if (!r.ok) {
          setResults([]);
          return;
        }
        const data = (await r.json()) as { items: Result[] };
        setResults(data.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-label="Search the atelier">
      <div className="search-overlay-scrim" onClick={onClose} aria-hidden="true" />

      <div className="search-overlay-panel">
        <button
          type="button"
          className="search-overlay-close"
          aria-label="Close search"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="search-overlay-input-wrap">
          <svg
            className="search-overlay-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a piece, collection, or style…"
            className="search-overlay-input"
            autoComplete="off"
          />
        </div>

        <div className="search-overlay-body">
          {/* Quick links shown until the user types */}
          {!touched && (
            <>
              <div className="search-overlay-eyebrow">Quick links</div>
              <ul className="search-overlay-quick">
                {QUICK_LINKS.map((q) => (
                  <li key={q.href}>
                    <Link href={q.href} onClick={onClose}>
                      {q.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Live results */}
          {touched && (
            <>
              {loading && <div className="search-overlay-loading">Searching…</div>}
              {!loading && results.length === 0 && query.trim().length >= 2 && (
                <div className="search-overlay-empty">
                  No pieces match &ldquo;{query}&rdquo;. Try a shape, a collection name, or a metal.
                </div>
              )}
              {results.length > 0 && (
                <ul className="search-overlay-results">
                  {results.map((r) => (
                    <li key={r.sku}>
                      <Link
                        href={`/product/${r.slug}`}
                        className="search-result"
                        onClick={onClose}
                      >
                        <div className="search-result-img">
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt={r.name} />
                          ) : (
                            <div className="search-result-img-fallback" aria-hidden="true">
                              ◯
                            </div>
                          )}
                        </div>
                        <div className="search-result-meta">
                          <div className="search-result-name">{r.name}</div>
                          <div className="search-result-sub">
                            {r.collection ?? r.category} · Style {r.sku}
                          </div>
                        </div>
                        {r.price_display && (
                          <div className="search-result-price">{r.price_display}</div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
