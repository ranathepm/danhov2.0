import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products';
import { stripMetalSuffix } from '@/lib/product-display';

const PREVIEW_COUNT = 8;

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
  /** href for the "View All" button — full listing page */
  viewAllHref: string;
};

export default function HomepageShopSection({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
}: Props) {
  const preview = products.slice(0, PREVIEW_COUNT);

  return (
    <section id={id} className="hp-shop-section">
      <div className="hp-shop-header">
        <span className="section-eyebrow">{eyebrow}</span>
        <h2 className="hp-shop-title">{title}</h2>
        <p className="hp-shop-subtitle">{subtitle}</p>
      </div>

      {preview.length > 0 ? (
        <div className="hp-shop-grid">
          {preview.map((product) => (
            <ProductPreviewCard key={product.sku} product={product} />
          ))}
        </div>
      ) : (
        <div className="hp-shop-empty">
          <p>Browse our full collection below.</p>
        </div>
      )}

      <div className="hp-shop-footer">
        <Link href={viewAllHref} className="btn-solid">
          View All {eyebrow}
        </Link>
        <span className="hp-shop-count">
          {products.length > PREVIEW_COUNT
            ? `Showing ${PREVIEW_COUNT} of ${products.length} styles`
            : `${products.length} handcrafted styles`}
        </span>
      </div>
    </section>
  );
}

function ProductPreviewCard({ product }: { product: Product }) {
  const img = product.images?.[0] ?? null;
  const name = stripMetalSuffix(product.name);

  return (
    <Link href={`/product/${product.slug}`} className="hp-prod-card">
      <div className="hp-prod-media">
        {img ? (
          <Image
            src={img}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            style={{ objectFit: 'contain', padding: '12px', mixBlendMode: 'multiply' }}
          />
        ) : (
          <div className="hp-prod-placeholder">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="16" stroke="#AC3438" strokeWidth="1.2" />
              <circle cx="24" cy="24" r="8" stroke="#AC3438" strokeWidth="0.7" opacity="0.5" />
              <circle cx="24" cy="24" r="3" fill="#AC3438" opacity="0.3" />
            </svg>
          </div>
        )}
      </div>
      <div className="hp-prod-info">
        {product.collection && (
          <span className="hp-prod-collection">{product.collection}</span>
        )}
        <h3 className="hp-prod-name">{name}</h3>
        {product.price_display && (
          <p className="hp-prod-price">{product.price_display}</p>
        )}
      </div>
    </Link>
  );
}
