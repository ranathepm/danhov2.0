import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchProductWithPricingBySlug } from '@/lib/products';
import { priceAllOptions } from '@/lib/pricing';
import NarrativeBox from '@/components/NarrativeBox';
import WishlistHeart from '@/components/WishlistHeart';
import ProductGalleryMetal from '@/components/ProductGalleryMetal';
import ProductOptions from '@/components/ProductOptions';
import { MetalProvider } from '@/components/MetalContext';
import {
  buildBreadcrumb,
  buildProduct,
  jsonLdScript,
} from '@/lib/seo';
import {
  getOrGenerateNarrative,
  occasionForCategory,
} from '@/lib/narratives';
import { stripMetalSuffix } from '@/lib/product-display';
import RelatedProducts from '@/components/RelatedProducts';

type Params = { slug: string };

export const revalidate = 300;

const CATEGORY_HREF: Record<string, { href: string; label: string }> = {
  engagement: { href: '/engagement-rings', label: 'Engagement Rings' },
  wedding: { href: '/wedding-bands', label: 'Wedding Bands' },
  fine: { href: '/fine-jewelry', label: 'Fine Jewelry' },
  mens: { href: '/mens', label: "Men's Jewelry" },
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const product = await fetchProductWithPricingBySlug(params.slug);
  if (!product) return { title: 'Product not found' };

  const occasion = occasionForCategory(product.category);
  const narrative = await getOrGenerateNarrative(product, occasion);
  const hero = product.images?.[0] ?? null;

  const cleanName = stripMetalSuffix(product.name);
  return {
    title: cleanName,
    description: narrative.meta_description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: cleanName,
      description: narrative.meta_description,
      type: 'website',
      url: `/product/${product.slug}`,
      images: hero ? [{ url: hero }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanName,
      description: narrative.meta_description,
      images: hero ? [hero] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await fetchProductWithPricingBySlug(params.slug);
  if (!product) notFound();

  // Compute live prices per metal variant so the detail page can update
  // the displayed price when the customer switches metal swatches.
  let pricemap: Record<string, number> = {};
  // Gold weight is mandatory — without it the formula collapses to just
  // the stored labour cost (e.g. $800) for every metal, overriding the
  // correct price_display. Markup must also be set so the gold component
  // is meaningful.
  // Weight alone is sufficient — commission_rate defaults to 0 and labour/stones
  // are already computed and stored; no longer gated on markup_multiplier.
  const hasPricingData = (product.gold_weight_g ?? 0) > 0;
  if (hasPricingData) {
    try {
      const breakdowns = await priceAllOptions(product, product.metals);
      for (const b of breakdowns) {
        // Belt-and-suspenders: only store prices where gold actually
        // contributed (metal_cost_usd > 0). Discards labour-only totals
        // that would otherwise override a correct price_display.
        if (b.total_usd > 0 && b.metal_cost_usd > 0) {
          pricemap[b.metal_used] = b.total_usd;
        }
      }
    } catch {
      // GoldAPI unavailable — ProductOptions will fall back to price_display
    }
  }

  const primaryCategory = product.categories[0] ?? product.category;
  const catLink = CATEGORY_HREF[primaryCategory] ?? CATEGORY_HREF.engagement;

  const occasion = occasionForCategory(product.category);
  const narrative = await getOrGenerateNarrative(product, occasion);
  const displayName = stripMetalSuffix(product.name);

  // Approximate price for the Product JSON-LD (display string parses, else 0)
  const priceForLd = parsePrice(product.price_display);

  const breadcrumb = buildBreadcrumb([
    { name: 'Home', url: '/' },
    { name: catLink.label, url: catLink.href },
    { name: displayName, url: `/product/${product.slug}` },
  ]);
  const productLd = buildProduct(product, priceForLd, narrative.meta_description);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productLd)}
      />

      {/* BREADCRUMB */}
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="bc-sep">/</span>
        <Link href={catLink.href}>{catLink.label}</Link>
        <span className="bc-sep">/</span>
        <span>{displayName}</span>
      </nav>

      {/* METAL AVAILABILITY NOTICE */}
      <div className="product-metal-notice">
        This ring is handcrafted to order in all metals shown &nbsp;·&nbsp; Photography reflects our primary color variant
      </div>

      {/* PRODUCT DETAIL — wrapped in MetalProvider so the gallery on
          the left and the swatches + CTA on the right share one
          selected-metal state. Clicking a swatch updates both columns. */}
      <MetalProvider
        initialMetal={
          product.default_metal && product.metals.includes(product.default_metal)
            ? product.default_metal
            : product.metals[0] ?? null
        }
      >
      <div className="product-detail">
        {/* IMAGE GALLERY */}
        <div className="product-image-col">
          <ProductGalleryMetal
            defaultImages={product.images ?? []}
            metalImages={product.metal_images}
            alt={product.name}
            collection={product.collection}
          />
        </div>

        {/* INFO */}
        <div className="product-info-col">
          {product.collection && (
            <span className="product-category-label">{product.collection}</span>
          )}
          <div className="product-name-row">
            <h1 className="product-name">{displayName}</h1>
            <WishlistHeart slug={product.slug} />
          </div>
          <span className="product-style-num">Style {product.sku}</span>
          <div className="product-divider" />

          <ProductOptions
            sku={product.sku}
            slug={product.slug}
            name={product.name}
            collection={product.collection}
            metals={product.metals}
            defaultMetal={product.default_metal}
            images={product.images}
            price_display={product.price_display}
            pricemap={pricemap}
          />

          {product.metals.length > 1 && (
            <p className="product-metals-line">Also crafted in {product.metals.join(' · ')}</p>
          )}

          <NarrativeBox
            slug={product.slug}
            defaultOccasion={occasion}
            defaultNarrative={narrative.narrative}
          />
          <p className="product-desc product-desc-sub">
            Each {displayName} is individually cast, set, and finished by master jewelers in Los Angeles — made to order in your preferred metal and size. Available in {product.metals.length > 0 ? product.metals.join(', ') : '14k or 18k gold (yellow, white, or rose)'}.
          </p>

          <button
            type="button"
            className="dnh-trigger dnh-trigger--listing"
            style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
            data-dnh={`I'm looking at the ${product.name} (Style ${product.sku}). Tell me about this piece.`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M7 1L8 5.5L12.5 7L8 8.5L7 13L6 8.5L1.5 7L6 5.5L7 1Z"
                fill="currentColor"
              />
            </svg>
            ASK US ABOUT THIS RING
          </button>

          <p className="product-handcraft-note">
            Each DANHOV piece is handcrafted to order in Los Angeles. Contact us to begin your journey or ask about custom sizing.
          </p>

          <div className="product-attributes">
            <div className="product-attr-row">
              <svg className="product-attr-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2L14 8H20L15.5 11.5L17.5 17.5L12 14L6.5 17.5L8.5 11.5L4 8H10L12 2Z" stroke="#AC3438" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <div className="product-attr-text">
                <strong>Handcrafted in Los Angeles</strong>
                Each ring is individually cast, set, and finished by master jewelers since 1984.
              </div>
            </div>
            <div className="product-attr-row">
              <svg className="product-attr-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="#AC3438" strokeWidth="1.2" />
                <path d="M12 6v6l4 2" stroke="#AC3438" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <div className="product-attr-text">
                <strong>Custom Sizing Available</strong>
                All styles can be crafted in your exact size, metal preference, and stone selection.
              </div>
            </div>
            <div className="product-attr-row">
              <svg className="product-attr-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="#AC3438"
                  strokeWidth="1.2"
                />
              </svg>
              <div className="product-attr-text">
                <strong>Lifetime Craftsmanship Warranty</strong>
                DANHOV stands behind every piece with our commitment to enduring quality.
              </div>
            </div>
          </div>
        </div>
      </div>
      </MetalProvider>

      <RelatedProducts
        currentSlug={product.slug}
        collection={product.collection}
        category={primaryCategory}
      />
    </>
  );
}

function parsePrice(display: string | null | undefined): number {
  if (!display) return 0;
  const m = display.match(/[\d,]+(?:\.\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(/,/g, ''));
}
