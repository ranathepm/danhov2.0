'use client';

import { useState } from 'react';
import SettingGallery from '@/components/SettingGallery';
import SettingDetailClient from '@/components/SettingDetailClient';

interface ProductInfo {
  slug: string;
  sku: string;
  name: string;
  collection: string | null;
  metals: string[];
  price_display: string | null;
}

interface Props {
  product: ProductInfo;
  defaultMetal: string | null;
  images: string[];
  metalImages: Record<string, string[]>;
  diamondId?: string;
}

export default function SettingDetailLayout({ product, defaultMetal, images, metalImages, diamondId }: Props) {
  const [metal, setMetal] = useState(defaultMetal ?? product.metals?.[0] ?? '');

  // Use metal-specific images when available, fall back to default product images
  const activeImages =
    metal && metalImages[metal] && metalImages[metal].length > 0
      ? metalImages[metal]
      : images;

  return (
    <div className="sd-layout">
      <SettingGallery images={activeImages} name={product.name} />
      <SettingDetailClient
        product={product}
        metal={metal}
        onMetalChange={setMetal}
        diamondId={diamondId}
      />
    </div>
  );
}
