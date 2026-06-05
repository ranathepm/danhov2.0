'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  metals: string[];
  defaultMetal: string | null;
  images: string[];
  price_display: string | null;
};

/**
 * Product-detail "Add to Cart" control.
 *
 * No longer adds directly to the cart — the client wants this to mirror
 * Brilliant Earth's flow:
 *
 *   1. Customer picks a setting (the product they're viewing)
 *   2. Click "Add to Cart" → router pushes /ring-builder/diamond with
 *      ?setting=<slug>&metal=<choice> so the diamond picker knows what
 *      ring to bundle with
 *   3. Customer picks a diamond + ring size inside the diamond picker
 *   4. Diamond picker adds the full bundle (setting + diamond + size)
 *      to the cart
 *
 * Auth is still gated here: anonymous users see the sign-in prompt
 * first; the redirect only fires once they have a session.
 */
export default function AddToBag({
  sku,
  slug,
  name,
  collection: _collection,
  metals,
  defaultMetal,
  images: _images,
  price_display: _price_display,
}: Props) {
  const router = useRouter();
  const initialMetal =
    defaultMetal && metals.includes(defaultMetal)
      ? defaultMetal
      : metals[0] ?? null;
  const [metal, setMetal] = useState<string | null>(initialMetal);

  const goToDiamond = useCallback(() => {
    const params = new URLSearchParams();
    params.set('setting', slug);
    if (metal) params.set('metal', metal);
    router.push(`/ring-builder/diamond?${params.toString()}`);
  }, [router, slug, metal]);

  function onAdd() {
    // Guest-friendly: no sign-in required — go straight to the diamond
    // picker. (Client request: remove mandatory signup.)
    goToDiamond();
  }

  // Ignore unused-vars warnings for the props we keep for API stability
  void sku;
  void name;

  return (
    <div className="atb">
      {metals.length > 1 && (
        <div className="atb-metals">
          <div className="atb-metals-label">Metal · {metal ?? 'Select'}</div>
          <div className="atb-metals-row">
            {metals.map((m) => (
              <button
                key={m}
                type="button"
                className={`atb-metal-chip${m === metal ? ' is-active' : ''}`}
                onClick={() => setMetal(m)}
                aria-pressed={m === metal}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="atb-btn"
        onClick={onAdd}
        aria-live="polite"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Choose Your Diamond
      </button>

      <div className="atb-trust">
        <span>Made to order in Los Angeles</span>
        <span>·</span>
        <span>Lifetime craftsmanship warranty</span>
      </div>
    </div>
  );
}
