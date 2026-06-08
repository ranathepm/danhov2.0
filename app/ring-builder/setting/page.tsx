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
  searchParams: { diamond?: string };
}

export default async function SelectRingPage({ searchParams }: PageProps) {
  const products = await fetchProductsByCategory('engagement');
  const diamondId = searchParams.diamond;

  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={!!diamondId} />

      <section className="builder-section-head">
        <span className="section-eyebrow">{diamondId ? 'Add a Setting' : 'Step 1 of 3'}</span>
        <h1 className="section-title">{diamondId ? 'Choose a setting for your diamond' : 'Choose your setting'}</h1>
        <p className="section-body">
          Every DANHOV setting is handcrafted in Los Angeles. Select the one that speaks
          to you{diamondId ? ' — your diamond will be paired automatically.' : ', then choose your diamond.'}
        </p>
      </section>

      <SettingBrowser products={products} diamondId={diamondId} />

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
