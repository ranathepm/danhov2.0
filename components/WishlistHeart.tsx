'use client';

import { useWishlist } from '@/components/WishlistProvider';

export default function WishlistHeart({ slug }: { slug: string }) {
  const { slugs, toggle } = useWishlist();
  const saved = slugs.has(slug);

  return (
    <button
      type="button"
      className={`wishlist-heart${saved ? ' is-saved' : ''}`}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? '#AC3438' : 'none'} stroke="#AC3438" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
