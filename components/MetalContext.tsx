'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type Ctx = {
  selectedMetal: string | null;
  setSelectedMetal: (m: string | null) => void;
};

const MetalContext = createContext<Ctx | null>(null);

/**
 * Shared metal-selection state for the product detail page.
 *
 * Both columns of the detail layout need to react to a metal swatch
 * click — the gallery on the left swaps to the selected metal's
 * photos, and the swatch row + CTA on the right update their
 * displayed label and the diamond-picker redirect target.
 *
 * The provider sits at the top of the .product-detail tree so both
 * client subtrees (ProductGalleryMetal, ProductOptions) read the
 * same useState.
 */
export function MetalProvider({
  initialMetal,
  children,
}: {
  initialMetal: string | null;
  children: ReactNode;
}) {
  const [selectedMetal, setSelectedMetal] = useState<string | null>(initialMetal);
  return (
    <MetalContext.Provider value={{ selectedMetal, setSelectedMetal }}>
      {children}
    </MetalContext.Provider>
  );
}

export function useMetal(): Ctx {
  const ctx = useContext(MetalContext);
  if (!ctx) {
    throw new Error('useMetal must be used inside <MetalProvider>');
  }
  return ctx;
}
