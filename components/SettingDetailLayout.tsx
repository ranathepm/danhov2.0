'use client';

import { useState } from 'react';
import SettingGallery from '@/components/SettingGallery';
import SettingDetailClient, { type ShapeOption } from '@/components/SettingDetailClient';

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
  defaultShape: string;
  defaultMetal: string | null;
  shapes: ShapeOption[];
  images: string[];
}

const SHAPE_ORDER = ['round', 'oval', 'cushion', 'princess', 'pear', 'emerald', 'marquise', 'radiant', 'heart', 'asscher'];

export default function SettingDetailLayout({ product, defaultShape, defaultMetal, shapes, images }: Props) {
  const initIdx = (() => {
    if (images.length <= 1) return 0;
    const si = SHAPE_ORDER.indexOf(defaultShape);
    return si >= 0 ? si % images.length : 0;
  })();

  const [activeIdx, setActiveIdx] = useState(initIdx);

  function handleShapeChange(_shape: string, shapeIdx: number) {
    if (images.length <= 1) return;
    setActiveIdx(shapeIdx % images.length);
  }

  return (
    <div className="sd-layout">
      <SettingGallery
        images={images}
        name={product.name}
        activeIndex={activeIdx}
        onActiveChange={setActiveIdx}
      />
      <SettingDetailClient
        product={product}
        defaultShape={defaultShape}
        defaultMetal={defaultMetal}
        shapes={shapes}
        onShapeChange={handleShapeChange}
      />
    </div>
  );
}
