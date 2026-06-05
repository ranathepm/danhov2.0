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
          heading: 'Return Window & Restocking Fees',
          body: [
            'Returns are accepted within 30 days of purchase.',
            'Restocking fees apply to high-end products: diamonds carry a 25% restocking fee, lab-grown diamonds 40%, and moissanite 50%.',
            'Engraved items carry an additional $25 re-polishing fee.',
          ],
        },
        {
          heading: 'Eligible Items',
          body: [
            'Engagement rings, bands, pendants, and earrings qualify for returns only if undamaged and in new, unused condition.',
            'Loose diamonds must be accompanied by the original laboratory grading report. A missing certificate will result in a $250 charge to replace it.',
            'Custom orders cannot be returned.',
          ],
        },
        {
          heading: 'Return Process',
          body: [
            'To initiate a return, contact us at cs@danhov.com. Our team will provide a prepaid FedEx label and a Return Authorization number within one to two business days.',
            'US and Canada customers receive complimentary return shipping labels (limited to three per customer). International customers are responsible for a $50 return shipping fee.',
          ],
        },
        {
          heading: 'Refund Timeline',
          body: [
            'Refunds are processed within two weeks of receiving your return, using the original payment method.',
            'Orders paid by bank wire are refunded by company check.',
          ],
        },
        {
          heading: 'Shipping',
          body: [
            'Domestic (US) shipping is complimentary and fully insured, sent via FedEx Priority Overnight with signature required.',
            'International shipments are fully insured and hand-delivered where possible. Production plus shipping is typically 4–6 weeks from a confirmed order.',
          ],
        },
        {
          heading: 'Sizing & Resizing',
          body: [
            'One complimentary resize (one size up or down) is included within 60 days of delivery on most rings.',
            'Wedding and engagement bands with ¾ or more diamonds around the band are limited to ½-size adjustments.',
            'Certain designs — including tension rings — are not eligible for resizing.',
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
