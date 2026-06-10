import type { Metadata } from 'next';
import BuilderStepper from '@/components/BuilderStepper';
import DiamondPicker, { type Diamond } from '@/components/DiamondPicker';
import { cachedSearchDiamonds } from '@/lib/nivoda-cache';
import type { NivodaShape } from '@/lib/nivoda';
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
  shape?: string;
};

const VALID_SHAPES = ['ROUND', 'OVAL', 'PRINCESS', 'CUSHION', 'EMERALD', 'PEAR', 'HEART', 'MARQUISE', 'RADIANT', 'ASSCHER'];

export default async function SelectDiamondPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  // Prefetch the default diamond grid on the server so DiamondPicker renders
  // items immediately on first paint — no client-side fetch waterfall.
  const initialShape = (
    VALID_SHAPES.includes(searchParams.shape?.toUpperCase() ?? '')
      ? searchParams.shape!.toUpperCase()
      : 'ROUND'
  ) as NivodaShape;
  let initialItems: Diamond[] = [];
  let initialTotalCount = 0;
  try {
    // Race against a 2.5s timeout — if the Nivoda cache is cold the API call
    // can block for 10 s+. We'd rather render skeleton cards immediately and
    // let the client fetch complete in the background than blank the page.
    const result = await Promise.race([
      cachedSearchDiamonds(
        {
          shapes: [initialShape],
          labgrown: false,
          sizes: { from: 0.5, to: 2.5 },
          color: ['D', 'E', 'F', 'G', 'H'],
          clarity: ['VS1', 'VS2', 'SI1'],
          cut: ['EX', 'ID'],
          availability: 'AVAILABLE',
          has_image: true,
        },
        { limit: 24, offset: 0, order: { type: 'price', direction: 'ASC' } }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('prefetch timeout')), 2500)
      ),
    ]);
    initialItems = (result.result.items ?? []) as Diamond[];
    initialTotalCount = result.result.total_count ?? 0;
  } catch {
    // Timeout or Nivoda unavailable — DiamondPicker renders skeletons and
    // fires its own client-side fetch immediately on mount.
  }

  return (
    <main className="builder-page builder-page--diamond">
      <BuilderStepper
        current={2}
        hasSetting={!!searchParams.setting}
        hasDiamond={!!searchParams.diamond}
        settingSlug={searchParams.setting}
        diamondId={searchParams.diamond}
      />

      <section className="builder-section-head builder-section-head--compact">
        <span className="section-eyebrow">Step 2 of 3</span>
        <h1 className="section-title">Select your <em>diamond</em></h1>
      </section>

      <DiamondPicker
        settingSlug={searchParams.setting}
        metal={searchParams.metal}
        initialOfferId={searchParams.diamond}
        initialItems={initialItems}
        initialTotalCount={initialTotalCount}
      />
    </main>
  );
}
