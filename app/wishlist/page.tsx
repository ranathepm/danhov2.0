import type { Metadata } from 'next';
import { fetchAllActiveProducts } from '@/lib/products';
import WishlistContent from './WishlistContent';

export const metadata: Metadata = {
  title: 'Wishlist · DANHOV',
  description: 'Your saved DANHOV pieces.',
};

export default async function WishlistPage() {
  const products = await fetchAllActiveProducts();
  return <WishlistContent allProducts={products} />;
}
