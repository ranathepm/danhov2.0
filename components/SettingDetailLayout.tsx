'use client';

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
}

export default function SettingDetailLayout({ product, defaultMetal, images }: Props) {
  return (
    <div className="sd-layout">
      <SettingGallery images={images} name={product.name} />
      <SettingDetailClient
        product={product}
        defaultMetal={defaultMetal}
      />
    </div>
  );
}
