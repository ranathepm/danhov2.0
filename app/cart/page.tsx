import type { Metadata } from 'next';
import CartPageClient from './CartPageClient';

export const metadata: Metadata = {
  title: 'Your Cart · DANHOV',
  description: 'Review your selected DANHOV pieces before commission.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
