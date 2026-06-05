import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Lifetime Warranty',
  description:
    'Every DANHOV piece carries a lifetime craftsmanship warranty covering manufacturing defects, with complimentary first-year service and professional cleaning.',
  alternates: { canonical: '/warranty' },
};

export default function WarrantyPage() {
  return (
    <PolicyPage
      slug="warranty"
      title="Lifetime Warranty"
      intro="Every DANHOV piece carries a lifetime craftsmanship warranty. We stand behind every ring we make."
      sections={[
        {
          heading: 'What is covered',
          body: [
            "Your lifetime manufacturer's warranty covers any manufacturing defects in materials and workmanship for as long as you own the piece.",
            'Re-tipping, polishing, and sizing adjustments are complimentary in the first year and modestly priced thereafter.',
            'We also offer complimentary professional cleaning every 6–12 months on DANHOV-purchased pieces.',
          ],
        },
        {
          heading: 'Keeping your warranty valid',
          body: [
            'The warranty automatically terminates if any repairs or modifications — beyond setting the center stone — are made by anyone other than DANHOV. Please contact us before having any work done so we can protect your coverage.',
          ],
        },
      ]}
    />
  );
}
