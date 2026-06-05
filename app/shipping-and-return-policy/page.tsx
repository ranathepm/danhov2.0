import type { Metadata } from 'next';
import PolicyPage from '@/components/PolicyPage';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description:
    'DANHOV shipping and return policy — complimentary insured US shipping, 30-day returns on non-customised pieces, and one complimentary resizing within 60 days.',
  alternates: { canonical: '/shipping-and-return-policy' },
};

export default function ShippingReturnsPage() {
  return (
    <PolicyPage
      slug="shipping-and-return-policy"
      title="Shipping & Returns"
      intro="Every DANHOV piece is handcrafted to order in Los Angeles, then shipped fully insured. Here is exactly what to expect."
      sections={[
        {
          heading: 'Shipping',
          body: [
            'Domestic (US) shipping is complimentary and fully insured, sent via FedEx Priority Overnight with signature required.',
            'International shipments are fully insured and hand-delivered where possible. Production plus shipping is typically 4–6 weeks from a confirmed order.',
          ],
        },
        {
          heading: 'Returns',
          body: [
            'Non-customised pieces carry a 30-day return policy with a full refund to the original payment method.',
            'Customised or personalised pieces are evaluated case-by-case — please reach out directly and we will take care of you.',
            'One complimentary resizing is included within 60 days of delivery.',
          ],
        },
        {
          heading: 'Deposits',
          body: [
            'A 50% deposit secures your commission and locks your price; the balance is due before shipping. Deposits can be paid online via Stripe or by phone with a specialist.',
          ],
        },
      ]}
    />
  );
}
