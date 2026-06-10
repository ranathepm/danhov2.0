import type { Metadata } from 'next';
import { fetchProductsByCategory } from '@/lib/products';
import BuilderStepper from '@/components/BuilderStepper';
import SettingBrowser from '@/components/SettingBrowser';
import '../builder.css';

export const metadata: Metadata = {
  title: 'Choose Your Setting · Ring Builder',
  description:
    'Browse DANHOV handcrafted engagement ring settings. Filter by style, metal, shape, and price — then choose your diamond.',
  alternates: { canonical: '/ring-builder/setting' },
};

export const revalidate = 300;

interface PageProps {
  searchParams: { diamond?: string; diamonds?: string };
}

export default async function SelectRingPage({ searchParams }: PageProps) {
  const products = await fetchProductsByCategory('engagement');
  // Prefer multi-diamond param; fall back to single
  const diamondsParam = searchParams.diamonds || null;
  const diamondId = diamondsParam
    ? diamondsParam.split('|')[0]
    : (searchParams.diamond || undefined);
  const hasDiamond = !!(diamondsParam || diamondId);

  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={hasDiamond} />

      <section className="builder-section-head">
        <span className="section-eyebrow">{hasDiamond ? 'Add a Setting' : 'Step 1 of 3'}</span>
        <h1 className="section-title">{hasDiamond ? 'Choose a setting for your diamond' : 'Choose your setting'}</h1>
        <p className="section-body">
          Every DANHOV setting is handcrafted in Los Angeles. Select the one that speaks
          to you{hasDiamond ? ' — your diamond will be paired automatically.' : ', then choose your diamond.'}
        </p>
      </section>

      <SettingBrowser products={products} diamondId={diamondId} diamondsParam={diamondsParam} />

      <div className="builder-advisor-strip">
        <span className="builder-advisor-text">Not sure which setting is right?</span>
        <button
          data-dnh="I'm in the ring builder choosing a setting. Can you help me pick one for my style?"
          className="builder-advisor-btn"
        >
          Ask the AI Advisor
        </button>
      </div>
    </main>
  );
}
