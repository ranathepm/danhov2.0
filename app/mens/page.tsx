import type { Metadata } from 'next';
import ListingPage from '@/components/ListingPage';
import ListingSchema from '@/components/ListingSchema';
import PageBlocks from '@/components/PageBlocks';
import { fetchProductsByCategory } from '@/lib/products';

export const metadata: Metadata = {
  title: "Men's Jewelry · Rings, Bracelets & Necklaces",
  description:
    "Men's jewelry handcrafted in Los Angeles — signet rings, bracelets, necklaces, and pendants in 14k or 18k gold. Made to order with a lifetime warranty.",
  alternates: { canonical: '/mens' },
};

export const revalidate = 300;

const COLLECTIONS = [
  { label: 'Rings', value: 'rings' },
  { label: 'Bracelets', value: 'bracelets' },
  { label: 'Necklaces & Pendants', value: 'necklaces' },
];

export default async function MensPage() {
  const products = await fetchProductsByCategory('mens');
  return (
    <>
      <ListingSchema category="mens" title="Men's Jewelry" />
      <ListingPage
      category="mens"
      title="Men's Jewelry"
      subtitle="Strength. Refined."
      collections={COLLECTIONS}
      showMetalFilter={false}
      aiPrompt="I'm looking at men's jewelry from DANHOV. Can you help me find something that suits me?"
      philosophyStripe={{
        quote:
          'Every piece is <span>handcrafted in Los Angeles</span> — designed for the man who understands that true strength is quiet, and true luxury endures.',
      }}
      products={products}
    />
    <PageBlocks pageSlug="mens" />
    </>
  );
}
