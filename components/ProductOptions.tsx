'use client';

import { useRouter } from 'next/navigation';
import MetalSwatches from '@/components/MetalSwatches';
import { useMetal } from '@/components/MetalContext';

type Props = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  metals: string[];
  defaultMetal: string | null;
  images: string[];
  price_display: string | null;
  /** Live-computed prices keyed by metal key (e.g. '18k_yellow' → 5390). */
  pricemap?: Record<string, number>;
};


export default function ProductOptions({
  sku: _sku,
  slug,
  name,
  collection: _collection,
  metals,
  defaultMetal: _defaultMetal,
  images: _images,
  price_display,
  pricemap = {},
}: Props) {
  const router = useRouter();
  const { selectedMetal, setSelectedMetal } = useMetal();
  const metal = selectedMetal;
  const setMetal = setSelectedMetal;

  // metal is already in key format ('platinum', '14k_yellow', etc.) — pricemap uses the same keys.
  const livePrice = metal ? pricemap[metal] : undefined;
  const displayPrice = livePrice
    ? '$' + Math.round(livePrice).toLocaleString('en-US')
    : (price_display ?? null);

  function goToDiamond() {
    const params = new URLSearchParams();
    params.set('setting', slug);
    if (metal) params.set('metal', metal);
    router.push(`/ring-builder/diamond?${params.toString()}`);
  }

  function buyRingOnly() {
    router.push(`/ring-builder/review?setting=${encodeURIComponent(slug)}`);
  }

  return (
    <>
      <MetalSwatches
        metals={metals}
        selectedMetal={metal}
        onSelect={(m) => setMetal(m)}
      />

      {displayPrice && (
        <p className="product-price">{displayPrice}</p>
      )}

      <div className="atb">
        <button
          type="button"
          className="atb-btn"
          onClick={goToDiamond}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Choose Your Diamond
        </button>

        <button
          type="button"
          className="atb-btn atb-btn--secondary"
          onClick={buyRingOnly}
        >
          Buy Ring Only
        </button>

        <div className="atb-trust">
          <span>Made to order in Los Angeles</span>
          <span>·</span>
          <span>Lifetime craftsmanship warranty</span>
        </div>
      </div>
    </>
  );
}
