'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/components/WishlistProvider';
import { stripMetalSuffix } from '@/lib/product-display';
import type { Product } from '@/lib/products';

function formatPrice(display: string | null): string {
  if (!display) return 'Inquire for pricing';
  const m = display.replace(/,/g, '').match(/[\d.]+/);
  if (!m) return display;
  return `$${Number(m[0]).toLocaleString('en-US')} USD`;
}

export default function WishlistContent({ allProducts }: { allProducts: Product[] }) {
  const { slugs, toggle } = useWishlist();

  const saved = allProducts.filter((p) => slugs.has(p.slug));

  return (
    <main className="wishlist-page">
      <div className="wishlist-header">
        <p className="wishlist-eyebrow">— Your DANHOV Wishlist</p>
        <h1 className="wishlist-title">Saved Pieces</h1>
        {saved.length > 0 && (
          <p className="wishlist-count">{saved.length} {saved.length === 1 ? 'piece' : 'pieces'} saved</p>
        )}
      </div>

      {saved.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9b8ad" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="wishlist-empty-text">No pieces saved yet.</p>
          <p className="wishlist-empty-sub">Tap the heart on any piece to save it here.</p>
          <div className="wishlist-empty-actions">
            <Link href="/engagement-rings" className="btn-primary">Browse Engagement Rings</Link>
            <Link href="/fine-jewelry" className="btn-solid">Fine Jewelry</Link>
          </div>
        </div>
      ) : (
        <div className="wishlist-grid">
          {saved.map((p) => {
            const hero = p.images?.[0] ?? null;
            return (
              <div key={p.slug} className="wishlist-card">
                <Link href={`/product/${p.slug}`} className="wishlist-card-img-wrap">
                  {hero ? (
                    <Image
                      src={hero}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="wishlist-card-placeholder" aria-hidden="true">◇</div>
                  )}
                </Link>
                <button
                  type="button"
                  className="wishlist-card-remove"
                  aria-label={`Remove ${p.name} from wishlist`}
                  onClick={() => toggle(p.slug)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#AC3438" stroke="#AC3438" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <div className="wishlist-card-body">
                  {p.collection && (
                    <p className="wishlist-card-collection">{p.collection}</p>
                  )}
                  <Link href={`/product/${p.slug}`} className="wishlist-card-name">
                    {stripMetalSuffix(p.name)}
                  </Link>
                  {p.sku && <p className="wishlist-card-sku">Style {p.sku}</p>}
                  <p className="wishlist-card-price">{formatPrice(p.price_display)}</p>
                  <Link href={`/product/${p.slug}`} className="wishlist-card-cta">
                    View Piece →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
