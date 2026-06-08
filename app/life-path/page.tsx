import type { Metadata } from 'next';
import LifePathClient from './LifePathClient';

export const metadata: Metadata = {
  title: 'The Life Path · DANHOV Jewelry',
  description:
    'Discover the ring encoded in your birth date. Enter your birthday and receive your life path number, zodiac sign, and an original geometric ring design — yours alone.',
  alternates: { canonical: '/life-path' },
};

export default function LifePathPage() {
  return <LifePathClient />;
}
