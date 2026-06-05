import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import BuilderStepper from '@/components/BuilderStepper';
import BuilderReview, { type ReviewDiamond } from '@/components/BuilderReview';
import '../builder.css';
import { fetchProductWithPricingBySlug } from '@/lib/products';
import { priceProduct } from '@/lib/pricing';
import { cachedGetDiamond } from '@/lib/nivoda-cache';

export const metadata: Metadata = {
  title: 'Complete Your Ring · Ring Builder',
  description:
    'Review your DANHOV ring commission — chosen setting, chosen diamond, total, and 50% deposit. Begin your made-to-order piece in Los Angeles.',
  alternates: { canonical: '/ring-builder/review' },
};

export const dynamic = 'force-dynamic';

function shapeDisplay(s: string | null): string {
  if (!s) return 'Round';
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function CompleteRingPage({
  searchParams,
}: {
  searchParams: { setting?: string; diamond?: string; hold?: string };
}) {
  const settingSlug = searchParams.setting;
  const offerId = searchParams.diamond;
  const holdId = searchParams.hold;

  if (!settingSlug) redirect('/ring-builder/setting');
  if (!offerId) redirect(`/ring-builder/diamond?setting=${settingSlug}`);

  const setting = await fetchProductWithPricingBySlug(settingSlug);
  if (!setting) redirect('/ring-builder/setting');

  // Pull the stone from Nivoda (60s cache; stale-safe)
  let nivoda: Awaited<ReturnType<typeof cachedGetDiamond>> | null = null;
  try {
    nivoda = await cachedGetDiamond(offerId);
  } catch (e) {
    console.error('review: nivoda lookup failed', e);
  }

  if (!nivoda || !nivoda.stone) {
    redirect(`/ring-builder/diamond?setting=${settingSlug}`);
  }

  // Live price for the setting (current spot)
  let settingPrice = 0;
  try {
    const breakdown = await priceProduct(setting, setting.default_metal);
    settingPrice = breakdown.total_usd;
  } catch {
    const m = setting.price_display?.match(/[\d,]+/);
    settingPrice = m ? Number(m[0].replace(/,/g, '')) : 0;
  }

  const cert = nivoda.stone.diamond.certificate;
  const reviewDiamond: ReviewDiamond = {
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

  return (
    <main className="builder-page">
      <BuilderStepper
        current={3}
        hasSetting={true}
        hasDiamond={true}
        settingSlug={settingSlug}
        diamondId={offerId}
      />

      <section className="builder-section-head">
        <span className="section-eyebrow">Step 04 of 04</span>
        <h1 className="section-title">Complete <em>your ring</em></h1>
        <p className="section-body">
          Review your pairing below. When you&apos;re ready, the 50% deposit secures your
          commission and your piece begins in our Los Angeles atelier.
        </p>
      </section>

      <BuilderReview
        setting={setting}
        diamond={reviewDiamond}
        settingPrice={settingPrice}
        holdId={holdId}
      />

      <div className="builder-review-edit-row">
        <Link href={`/ring-builder/setting?setting=${settingSlug}&diamond=${offerId}${holdId ? `&hold=${holdId}` : ''}`}>
          ← Edit Setting
        </Link>
        <Link href={`/ring-builder/diamond?setting=${settingSlug}&diamond=${offerId}${holdId ? `&hold=${holdId}` : ''}`}>
          ← Edit Diamond
        </Link>
      </div>
    </main>
  );
}
