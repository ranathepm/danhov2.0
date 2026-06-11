'use client';

import ProductGallery from '@/components/ProductGallery';
import { useMetal } from '@/components/MetalContext';

type Props = {
  defaultImages: string[];
  metalImages: Record<string, string[]> | null;
  alt: string;
  collection: string | null;
};

const METAL_FALLBACK: Record<string, string[]> = {
  '14k_white':  ['18k_white', 'platinum'],
  '18k_white':  ['14k_white', 'platinum'],
  'platinum':   ['18k_white', '14k_white'],
  '14k_yellow': ['18k_yellow'],
  '18k_yellow': ['14k_yellow'],
  '14k_rose':   ['18k_rose'],
  '18k_rose':   ['14k_rose'],
};

/** Strip empty/null entries so a half-populated metal array doesn't block the fallback chain. */
function validUrls(arr: string[] | undefined | null): string[] {
  return (arr ?? []).filter((u) => typeof u === 'string' && u.trim() !== '');
}

export default function ProductGalleryMetal({ defaultImages, metalImages, alt, collection }: Props) {
  const { selectedMetal } = useMetal();
  const mi = metalImages ?? {};

  function getImages(m: string | null): string[] {
    const defaults = validUrls(defaultImages);
    if (!m) return defaults;
    const specific = validUrls(mi[m]);
    if (specific.length) return specific;
    for (const fallback of (METAL_FALLBACK[m] ?? [])) {
      const fb = validUrls(mi[fallback]);
      if (fb.length) return fb;
    }
    return defaults;
  }

  return <ProductGallery images={getImages(selectedMetal)} alt={alt} collection={collection} />;
}
