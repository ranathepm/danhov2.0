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
};

/**
 * Composite product-detail options control. Holds the customer's metal
 * choice in one place and forwards it to:
 *   • the visible <MetalSwatches> colour-circle picker that sits below
 *     the product title
 *   • the "Choose Your Diamond" CTA at the bottom of the info column,
 *     which redirects to /ring-builder/diamond?setting=...&metal=...
 *     once the customer has confirmed a metal (and is signed in)
 *
 * The swatches and the CTA render in separate spots in the info column
 * — MetalSwatches via <MetalSwatchesSlot />, the CTA via <CtaSlot />.
 * The parent product page composes them inside the same client tree so
 * the metal state stays consistent.
 */
export default function ProductOptions({
  sku: _sku,
  slug,
  name,
  collection: _collection,
  metals,
  defaultMetal: _defaultMetal,
  images: _images,
  price_display,
}: Props) {
  const router = useRouter();
  // Metal state lives on the MetalProvider so both this CTA column
  // and the gallery on the left react to the same swatch click.
  const { selectedMetal, setSelectedMetal } = useMetal();
  const metal = selectedMetal;
  const setMetal = setSelectedMetal;

  function goToDiamond() {
    const params = new URLSearchParams();
    params.set('setting', slug);
    if (metal) params.set('metal', metal);
    router.push(`/ring-builder/diamond?${params.toString()}`);
  }

  function buyRingOnly() {
    router.push(`/ring-builder/review?setting=${encodeURIComponent(slug)}`);
  }

  function onCta() {
    goToDiamond();
  }

  return (
    <>
      <MetalSwatches
        metals={metals}
        selectedMetal={metal}
        onSelect={(m) => setMetal(m)}
      />

      {price_display && (
        <p className="product-price">{price_display}</p>
      )}

      <div className="atb">
        <button
          type="button"
          className="atb-btn"
          onClick={onCta}
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
