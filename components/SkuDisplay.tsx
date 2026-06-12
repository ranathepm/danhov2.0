'use client';

import { useMetal } from '@/components/MetalContext';

const METAL_SKU_SUFFIX: Record<string, string> = {
  platinum:     'PL',
  '14k_yellow': '14Y',
  '14k_white':  '14W',
  '14k_rose':   '14R',
  '18k_yellow': '18Y',
  '18k_white':  '18W',
  '18k_rose':   '18R',
};

/** Strips any existing metal suffix from a SKU (e.g. "SE500UQ-14Y" → "SE500UQ"). */
function stripSkuSuffix(sku: string): string {
  return sku.replace(/-?(PL|14Y|14W|14R|18Y|18W|18R)$/i, '');
}

export default function SkuDisplay({ sku }: { sku: string }) {
  const { selectedMetal } = useMetal();
  const base = stripSkuSuffix(sku);
  const suffix = selectedMetal ? (METAL_SKU_SUFFIX[selectedMetal] ?? 'PL') : 'PL';
  return <span className="product-style-num">Style {base}-{suffix}</span>;
}
