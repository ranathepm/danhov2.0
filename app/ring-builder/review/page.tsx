import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import BuilderStepper from '@/components/BuilderStepper';
import BuilderReview, { type ReviewDiamond } from '@/components/BuilderReview';
import '../builder.css';
import { fetchProductWithPricingBySlug } from '@/lib/products';
import { priceProduct } from '@/lib/pricing';
import { cachedGetDiamond } from '@/lib/nivoda-cache';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { setting?: string; diamond?: string; hold?: string };
}): Promise<Metadata> {
  const hasSetting = !!searchParams.setting;
  const hasDiamond = !!searchParams.diamond;
  if (hasSetting && hasDiamond)
    return {
      title: 'Complete Your Ring · Ring Builder',
      description:
        'Review your DANHOV ring commission — chosen setting, chosen diamond, total, and 50% deposit. Begin your made-to-order piece in Los Angeles.',
      alternates: { canonical: '/ring-builder/review' },
    };
  if (hasSetting)
    return {
      title: 'Purchase Setting · Ring Builder · DANHOV',
      description: 'Review and purchase your chosen DANHOV ring setting, handcrafted to order in Los Angeles.',
    };
  return {
    title: 'Purchase Diamond · Ring Builder · DANHOV',
    description: 'Review and purchase your chosen GIA-graded diamond from DANHOV.',
  };
}

export const dynamic = 'force-dynamic';

function shapeDisplay(s: string | null): string {
  if (!s) return 'Round';
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function CompleteRingPage({
  searchParams,
}: {
  searchParams: { setting?: string; diamond?: string; hold?: string; metal?: string };
}) {
  const settingSlug = searchParams.setting;
  const offerId = searchParams.diamond;
  const holdId = searchParams.hold;
  const chosenMetal = searchParams.metal ?? null;

  // Need at least one of setting or diamond
  if (!settingSlug && !offerId) redirect('/ring-builder/setting');

  const mode: 'ring' | 'setting' | 'diamond' =
    settingSlug && offerId ? 'ring' : settingSlug ? 'setting' : 'diamond';

  // ── Load setting (ring / setting modes) ───────────────────────────────
  let setting: Awaited<ReturnType<typeof fetchProductWithPricingBySlug>> | null = null;
  let settingPrice = 0;
  if (mode === 'ring' || mode === 'setting') {
    setting = await fetchProductWithPricingBySlug(settingSlug!);
    if (!setting) redirect('/ring-builder/setting');

    // If the customer has chosen a specific metal, compute the live price for
    // that metal — 18k costs ~28% more than 14k due to purity difference.
    // Fall back to price_display only when the chosen metal matches the default
    // (that's what price_display represents) or when pricing data is missing.
    const catalogPrice = parsePriceDisplay(setting.price_display);
    const metalMatchesDefault =
      !chosenMetal || chosenMetal === setting.default_metal;
    const canComputeLive =
      (setting.gold_weight_g ?? 0) > 0 || (setting.stones_value_usd ?? 0) > 0;

    if (!metalMatchesDefault && canComputeLive) {
      // Different metal — must compute live for accuracy
      try {
        const breakdown = await priceProduct(setting, chosenMetal);
        settingPrice = breakdown.total_usd;
      } catch {
        settingPrice = catalogPrice;
      }
    } else if (catalogPrice > 0) {
      settingPrice = catalogPrice;
    } else if (canComputeLive) {
      try {
        const breakdown = await priceProduct(setting, chosenMetal ?? setting.default_metal);
        settingPrice = breakdown.total_usd;
      } catch {
        settingPrice = 0;
      }
    }
  }

  // ── Load diamond (ring / diamond modes) ───────────────────────────────
  let reviewDiamond: ReviewDiamond | null = null;
  if (mode === 'ring' || mode === 'diamond') {
    let nivoda: Awaited<ReturnType<typeof cachedGetDiamond>> | null = null;
    try {
      nivoda = await cachedGetDiamond(offerId!);
    } catch (e) {
      console.error('review: nivoda lookup failed', e);
    }

    if (!nivoda?.stone) {
      if (mode === 'ring') redirect(`/ring-builder/diamond?setting=${settingSlug}`);
      else redirect('/ring-builder/diamond');
    } else {
      const cert = nivoda.stone.diamond.certificate;
      reviewDiamond = {
        offer_id: nivoda.stone.id,
        carat: cert?.carats ?? 1,
        shape: shapeDisplay(cert?.shape ?? null),
        color: cert?.color ?? '—',
        clarity: cert?.clarity ?? '—',
        cut: cert?.cut ?? '—',
        lab: cert?.lab ?? 'GIA',
        cert_number: cert?.certNumber ?? null,
        image: nivoda.stone.diamond.image ?? null,
        video: nivoda.stone.diamond.video ?? null,
        price_usd: Math.round(
          Number(nivoda.stone.markup_price ?? nivoda.stone.price ?? 0)
        ),
      };
    }
  }

  const stepperHasSetting = mode === 'ring' || mode === 'setting';
  const stepperHasDiamond = mode === 'ring' || mode === 'diamond';

  return (
    <main className="builder-page">
      <BuilderStepper
        current={3}
        hasSetting={stepperHasSetting}
        hasDiamond={stepperHasDiamond}
        settingSlug={settingSlug}
        diamondId={offerId}
      />

      <section className="builder-section-head">
        <span className="section-eyebrow">
          {mode === 'ring' ? 'Step 3 of 3' : 'Final Step'}
        </span>
        <h1 className="section-title">
          {mode === 'ring' ? (
            <>Complete <em>your ring</em></>
          ) : mode === 'setting' ? (
            <>Purchase <em>your setting</em></>
          ) : (
            <>Purchase <em>your diamond</em></>
          )}
        </h1>
        {mode !== 'diamond' && (
          <p className="section-body">
            {mode === 'ring'
              ? "Review your pairing below. When you're ready, the 50% deposit secures your commission and your piece begins in our Los Angeles atelier."
              : "Review your chosen setting. A 50% deposit secures your commission — your piece will be handcrafted to order in Los Angeles in 4–6 weeks."}
          </p>
        )}
      </section>

      <BuilderReview
        mode={mode}
        setting={setting ?? null}
        diamond={reviewDiamond}
        settingPrice={settingPrice}
        holdId={holdId}
        metal={chosenMetal}
      />

      <div className="builder-review-edit-row">
        {mode !== 'diamond' && (() => {
          const p = new URLSearchParams();
          if (settingSlug) p.set('setting', settingSlug);
          if (offerId) p.set('diamond', offerId);
          if (holdId) p.set('hold', holdId);
          const qs = p.toString();
          return (
            <Link href={`/ring-builder/setting${qs ? `?${qs}` : ''}`}>
              ← Edit Setting
            </Link>
          );
        })()}
        {mode !== 'setting' && (() => {
          const p = new URLSearchParams();
          if (settingSlug) p.set('setting', settingSlug);
          if (offerId) p.set('diamond', offerId);
          if (holdId) p.set('hold', holdId);
          if (offerId) p.set('inorder', offerId);
          const qs = p.toString();
          return (
            <Link href={`/ring-builder/diamond${qs ? `?${qs}` : ''}`}>
              ← {mode === 'diamond' ? 'Change Diamond' : 'Edit Diamond'}
            </Link>
          );
        })()}
      </div>
    </main>
  );
}

// Parses catalog price_display ("$5,700", "$5,700 – $7,200", etc.) → first number found
function parsePriceDisplay(display: string | null | undefined): number {
  if (!display) return 0;
  const m = display.match(/[\d,]+(?:\.\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(/,/g, ''));
}
