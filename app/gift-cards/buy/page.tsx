import type { Metadata } from 'next';
import GiftCardBuyFlow from './GiftCardBuyFlow';

export const metadata: Metadata = {
  title: 'Buy a Gift Card · DANHOV',
  description: 'Give the gift of a handcrafted DANHOV piece.',
};

export default function GiftCardBuyPage() {
  return <GiftCardBuyFlow />;
}
