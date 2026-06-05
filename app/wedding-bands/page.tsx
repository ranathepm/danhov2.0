import type { Metadata } from 'next';
import ListingPage from '@/components/ListingPage';
import ListingSchema from '@/components/ListingSchema';
import PageBlocks from '@/components/PageBlocks';
import { fetchProductsByCategory } from '@/lib/products';

export const metadata: Metadata = {
  title: "Wedding Bands · His & Hers · Handcrafted in Los Angeles",
  description:
    'Wedding bands handcrafted in Los Angeles since 1984 — His and Hers designs in 14k or 18k gold. Award-winning craftsmanship, made to order, lifetime warranty.',
  alternates: { canonical: '/wedding-bands' },
};

export const revalidate = 300;

const COLLECTIONS = [
  { label: 'Award Winners', value: 'award-winners' },
  { label: 'Her Bands', value: 'her-bands' },
  { label: 'His Bands', value: 'his-bands' },
];

export default async function WeddingBandsPage() {
  const products = await fetchProductsByCategory('wedding');
  return (
    <>
      <ListingSchema category="wedding" title="Wedding Bands" />
      <ListingPage
      category="wedding"
      title="Wedding Bands"
      subtitle="Bound. Together. Forever."
      collections={COLLECTIONS}
      showMetalFilter={false}
      aiPrompt="I'm looking at wedding bands and would love some guidance on styles and metals."
      philosophyStripe={{
        quote:
          'Every band is a <span>promise made permanent</span> — handcrafted in Los Angeles, worn for a lifetime.',
      }}
      products={products}
    />
    <PageBlocks pageSlug="wedding-bands" />
    </>
  );
}
