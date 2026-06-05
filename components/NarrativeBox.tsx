'use client';

import { useEffect, useState } from 'react';

type Occasion =
  | 'engagement'
  | 'wedding'
  | 'anniversary'
  | 'self-love'
  | 'sacred-union'
  | 'just-because';

const OPTIONS: { value: Occasion; label: string }[] = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'self-love', label: 'Self Love' },
  { value: 'sacred-union', label: 'Sacred Union' },
  { value: 'just-because', label: 'Just Because' },
];

type Props = {
  slug: string;
  defaultOccasion: Occasion;
  defaultNarrative: string;
};

export default function NarrativeBox({ slug, defaultOccasion, defaultNarrative }: Props) {
  const [occasion, setOccasion] = useState<Occasion>(defaultOccasion);
  const [narrative, setNarrative] = useState(defaultNarrative);
  const [loading, setLoading] = useState(false);
  // remember the default we rendered with — we don't refetch it
  const [cache] = useState<Record<string, string>>({
    [defaultOccasion]: defaultNarrative,
  });

  useEffect(() => {
    if (occasion === defaultOccasion) {
      setNarrative(defaultNarrative);
      return;
    }
    if (cache[occasion]) {
      setNarrative(cache[occasion]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/narrative?slug=${encodeURIComponent(slug)}&occasion=${occasion}`,
          { cache: 'force-cache' }
        );
        if (!r.ok) throw new Error('narrative fetch failed');
        const data = await r.json();
        if (cancelled) return;
        const text = (data?.narrative as string) || defaultNarrative;
        cache[occasion] = text;
        setNarrative(text);
      } catch {
        if (!cancelled) setNarrative(defaultNarrative);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [occasion, slug, defaultOccasion, defaultNarrative, cache]);

  return (
    <div className="narrative-box">
      <div className="narrative-occasion-row" role="tablist" aria-label="Choose the occasion">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={occasion === o.value}
            className={`narrative-occasion${occasion === o.value ? ' is-active' : ''}`}
            onClick={() => setOccasion(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p
        className={`narrative-text${loading ? ' is-loading' : ''}`}
        aria-live="polite"
      >
        {narrative}
      </p>
    </div>
  );
}
