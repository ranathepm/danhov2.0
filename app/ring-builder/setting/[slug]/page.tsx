import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchProductBySlug, fetchProductsByCategory } from '@/lib/products';
import BuilderStepper from '@/components/BuilderStepper';
import SettingDetailLayout from '@/components/SettingDetailLayout';
import '../../builder.css';

interface Props {
  params: { slug: string };
  searchParams: { metal?: string; diamond?: string; diamonds?: string };
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
    description: `Configure the ${product.name} (${product.sku}) — choose your metal, then select your diamond. Every piece handcrafted in Los Angeles.`,
    alternates: { canonical: `/ring-builder/setting/${params.slug}` },
  };
}

export default async function SettingDetailPage({ params, searchParams }: Props) {
  const product = await fetchProductBySlug(params.slug);
  if (!product) notFound();

  const defaultMetal = searchParams.metal ?? product.default_metal ?? (product.metals?.[0] ?? null);
  const metals = product.metals ?? [];
  // Prefer multi-diamond param; fall back to single
  const diamondsParam = searchParams.diamonds || null;
  const diamondId = diamondsParam
    ? diamondsParam.split('|')[0]
    : (searchParams.diamond || undefined);
  const hasDiamond = !!(diamondsParam || diamondId);

  const backHref = diamondsParam
    ? `/ring-builder/setting?diamonds=${encodeURIComponent(diamondsParam)}`
    : diamondId
    ? `/ring-builder/setting?diamond=${encodeURIComponent(diamondId)}`
    : '/ring-builder/setting';

  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={hasDiamond} />

      <Link href={backHref} className="sd-back">
        ← Back to browse
      </Link>

      <SettingDetailLayout
        product={{
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          collection: product.collection,
          metals,
          price_display: product.price_display,
        }}
        defaultMetal={defaultMetal}
        images={product.images ?? []}
        metalImages={(product.metal_images as Record<string, string[]>) ?? {}}
        diamondId={diamondId}
        diamondsParam={diamondsParam}
      />
    </main>
  );
}
