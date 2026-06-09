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

/**
 * Convert a display-name metal string to the pricing key used in pricemap.
 * e.g. 'White Gold' with metals[0]='18k Yellow Gold' → '18k_white'
 * The first element of the metals array always carries the karat prefix.
 */
function toMetalKey(displayName: string | null, metals: string[]): string | null {
  if (!displayName) return null;
  // Already in key format (e.g. '18k_yellow')
  if (/^(14k|18k)_(yellow|white|rose)$/.test(displayName)) return displayName;

  const puritySource = metals[0] ?? '';
  const pMatch = puritySource.match(/(14k|18k)/i);
  const purity = pMatch ? pMatch[1].toLowerCase() : '18k';

  const d = displayName.toLowerCase();
  if (d.includes('yellow')) return `${purity}_yellow`;
  if (d.includes('rose')) return `${purity}_rose`;
  if (d.includes('white')) return `${purity}_white`;
  if (d.includes('gold')) return `${purity}_yellow`;
  return null;
}

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

  // Derive the live price for the currently selected metal.
  const key = toMetalKey(metal, metals);
  const livePrice = key ? pricemap[key] : undefined;
  const displayPrice = livePrice
    ? '$' + livePrice.toLocaleString('en-US')
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
