import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProductBySlug, fetchProductsByCategory } from '@/lib/products';
import BuilderStepper from '@/components/BuilderStepper';
import SettingDetailClient from '@/components/SettingDetailClient';
import '../../builder.css';

interface Props {
  params: { slug: string };
  searchParams: { shape?: string; metal?: string };
}

export async function generateStaticParams() {
  const products = await fetchProductsByCategory('engagement');
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug);
  if (!product) return { title: 'Setting Not Found · DANHOV Ring Builder' };
  return {
    title: `${product.name} · Ring Builder · DANHOV`,
    description: `Configure the ${product.name} (${product.sku}) — choose your shape and metal, then select your diamond. Every piece handcrafted in Los Angeles.`,
    alternates: { canonical: `/ring-builder/setting/${params.slug}` },
  };
}

const SHAPES = [
  { value: 'round',    label: 'Round' },
  { value: 'oval',     label: 'Oval' },
  { value: 'cushion',  label: 'Cushion' },
  { value: 'princess', label: 'Princess' },
  { value: 'pear',     label: 'Pear' },
  { value: 'emerald',  label: 'Emerald' },
  { value: 'marquise', label: 'Marquise' },
  { value: 'radiant',  label: 'Radiant' },
  { value: 'heart',    label: 'Heart' },
  { value: 'asscher',  label: 'Asscher' },
];

export default async function SettingDetailPage({ params, searchParams }: Props) {
  const product = await fetchProductBySlug(params.slug);
  if (!product) notFound();

  const heroImage = product.images?.[0] ?? null;
  const thumbImages = product.images?.slice(1, 5) ?? [];

  const defaultShape = searchParams.shape ?? 'round';
  const defaultMetal = searchParams.metal ?? product.default_metal ?? (product.metals?.[0] ?? null);

  const metals = product.metals ?? [];

  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={false} />

      {/* Back to browse */}
      <Link href="/ring-builder/setting" className="sd-back">
        ← Back to browse
      </Link>

      <div className="sd-layout">
        {/* ── Left: image gallery ──────────────────────────────────────── */}
        <div className="sd-gallery">
          <div className="sd-main-img">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={product.name}
                fill
                style={{ objectFit: 'contain', padding: '24px' }}
                priority
              />
            ) : (
              <div className="sd-img-placeholder">
                <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
                  <circle cx="40" cy="40" r="28" stroke="#c9b8ad" strokeWidth="1" />
                  <circle cx="40" cy="40" r="16" stroke="#c9b8ad" strokeWidth="0.6" />
                  <circle cx="40" cy="12" r="4" fill="#c9b8ad" />
                </svg>
              </div>
            )}
            {/* 360° badge */}
            <div className="sd-360-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
              </svg>
              <span>360°</span>
            </div>
          </div>

          {/* Thumbnails */}
          {thumbImages.length > 0 && (
            <div className="sd-thumbs">
              {thumbImages.map((img, i) => (
                <div key={i} className="sd-thumb">
                  <Image
                    src={img}
                    alt={`${product.name} view ${i + 2}`}
                    fill
                    style={{ objectFit: 'contain', padding: '8px' }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: detail panel (client for shape/metal selection) ────── */}
        <SettingDetailClient
          product={{
            slug: product.slug,
            sku: product.sku,
            name: product.name,
            collection: product.collection,
            metals,
            price_display: product.price_display,
          }}
          defaultShape={defaultShape}
          defaultMetal={defaultMetal}
          shapes={SHAPES}
        />
      </div>
    </main>
  );
}
