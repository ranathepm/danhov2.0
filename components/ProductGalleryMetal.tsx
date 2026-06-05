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

export default function ProductGalleryMetal({ defaultImages, metalImages, alt, collection }: Props) {
  const { selectedMetal } = useMetal();
  const mi = metalImages ?? {};

  function getImages(m: string | null): string[] {
    if (!m) return defaultImages;
    if (mi[m]?.length) return mi[m];
    for (const fallback of (METAL_FALLBACK[m] ?? [])) {
      if (mi[fallback]?.length) return mi[fallback];
    }
    return defaultImages;
  }

  return <ProductGallery images={getImages(selectedMetal)} alt={alt} collection={collection} />;
}
