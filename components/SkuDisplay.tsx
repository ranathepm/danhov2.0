'use client';

import { useMetal } from '@/components/MetalContext';

function stripSkuSuffix(sku: string): string {
  return sku.replace(/-?(PL|PLAT|14Y|14W|14R|18Y|18W|18R)$/i, '');
}

function metalToSuffix(metal: string | null): string {
  if (!metal) return 'PL';
  const m = metal.toLowerCase();
  if (m.includes('plat')) return 'PL';
  const karatMatch = m.match(/(\d+)\s*k/);
  const karat = karatMatch ? karatMatch[1] : '14';
  if (m.includes('rose') || m.includes('pink')) return `${karat}R`;
  if (m.includes('white')) return `${karat}W`;
  if (m.includes('yellow') || m.includes('gold')) return `${karat}Y`;
  return 'PL';
}

export default function SkuDisplay({ sku }: { sku: string }) {
  const { selectedMetal } = useMetal();
  const base = stripSkuSuffix(sku);
  const suffix = metalToSuffix(selectedMetal);
  return <span className="product-style-num">Style {base}-{suffix}</span>;
}
