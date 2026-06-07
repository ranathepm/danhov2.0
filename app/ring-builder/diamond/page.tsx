import type { Metadata } from 'next';
import BuilderStepper from '@/components/BuilderStepper';
import DiamondPicker from '@/components/DiamondPicker';
import '../builder.css';

export const metadata: Metadata = {
  title: 'Select Your Diamond · Ring Builder',
  description:
    "Live diamond inventory — every stone is GIA / IGI graded and ethically traced. Filter by shape, carat, color, clarity, and cut to find the centre of your DANHOV piece.",
  alternates: { canonical: '/ring-builder/diamond' },
};

export const dynamic = 'force-dynamic';

type Search = {
  setting?: string;
  diamond?: string;
  hold?: string;
  metal?: string;
};

export default async function SelectDiamondPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  return (
    <main className="builder-page">
      <BuilderStepper
        current={2}
        hasSetting={!!searchParams.setting}
        hasDiamond={!!searchParams.diamond}
        settingSlug={searchParams.setting}
        diamondId={searchParams.diamond}
      />

      <section className="builder-section-head">
        <span className="section-eyebrow">Step 2 of 3</span>
        <h1 className="section-title">Select your <em>diamond</em></h1>
        <p className="section-body">
          Live inventory from our certified diamond network. Every stone is GIA- or IGI-graded,
          conflict-free, and ethically traced. Filter by shape, carat, colour, clarity, and cut to
          find your centre stone.
        </p>
      </section>

      <DiamondPicker
        settingSlug={searchParams.setting}
        metal={searchParams.metal}
        initialOfferId={searchParams.diamond}
      />
    </main>
  );
}
