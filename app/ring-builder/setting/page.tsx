import type { Metadata } from 'next';
import ListingSchema from '@/components/ListingSchema';
import BuilderStepper from '@/components/BuilderStepper';
import SettingPageClient from './SettingPageClient';
import { fetchProductsWithPricingByCategory } from '@/lib/products';
import { computeListingPriceMap } from '@/lib/pricing';
import '../builder.css';

export const metadata: Metadata = {
  title: 'Choose Your Setting · Ring Builder',
  description:
    'Browse DANHOV handcrafted engagement ring settings. Filter by style, metal, shape, and price — then choose your diamond.',
  alternates: { canonical: '/ring-builder/setting' },
};

export const revalidate = 300;

interface PageProps {
  searchParams: { diamond?: string; diamonds?: string };
}

export default async function SelectRingPage({ searchParams }: PageProps) {
  const rawProducts = await fetchProductsWithPricingByCategory('engagement');
  const priceMap = await computeListingPriceMap(rawProducts);
  const products = rawProducts.map(p => ({ ...p, price_computed: priceMap[p.sku] }));

  const diamondsParam = searchParams.diamonds || null;
  const diamondId = diamondsParam
    ? diamondsParam.split('|')[0]
    : (searchParams.diamond || undefined);
  const hasDiamond = !!(diamondsParam || diamondId);

  const dSuffix = diamondsParam
    ? `?diamonds=${encodeURIComponent(diamondsParam)}`
    : diamondId
    ? `?diamond=${encodeURIComponent(diamondId)}`
    : '';

  return (
    <div className="rb-setting-page">
      <div className="rb-setting-stepper">
        <BuilderStepper current={1} hasSetting={false} hasDiamond={hasDiamond} />
      </div>
      <ListingSchema category="engagement" title="Choose Your Setting" />
      <SettingPageClient products={products} dSuffix={dSuffix} hasDiamond={hasDiamond} />
    </div>
  );
}
