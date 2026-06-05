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

export default async function SelectRingPage() {
  const products = await fetchProductsByCategory('engagement');

  return (
    <main className="builder-page">
      <BuilderStepper current={1} hasSetting={false} hasDiamond={false} />

      <section className="builder-section-head">
        <span className="section-eyebrow">Step 1 of 3</span>
        <h1 className="section-title">Choose your setting</h1>
        <p className="section-body">
          Every DANHOV setting is handcrafted in Los Angeles. Select the one that speaks
          to you, then choose your diamond.
        </p>
      </section>

      <SettingBrowser products={products} />

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
