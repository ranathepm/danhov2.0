import { supabaseAnon } from '@/lib/supabase/anon';
import CategoryGridClient, { type EngagementCard } from './CategoryGridClient';

// ── Engagement collection definitions ─────────────────────────────────────

const COLLECTIONS = [
  {
    label: 'Abbraccio',
    value: 'abbraccio',
    meaning: 'The Embrace',
    body: "DANHOV's most iconic swirl settings — the stone held in a spiral embrace of gold.",
    href: '/collection/abbraccio',
  },
  {
    label: 'Voltaggio',
    value: 'voltaggio',
    meaning: 'The Voltage',
    body: 'Tension-set designs where the diamond is suspended by the energy of the ring itself.',
    href: '/collection/voltaggio',
  },
  {
    label: 'Classico',
    value: 'classico',
    meaning: 'The Classic',
    body: 'Timeless solitaire profiles refined over four decades of master craftsmanship in Los Angeles.',
    href: '/collection/classico',
  },
  {
    label: 'Norme de Danhov',
    value: 'norme',
    meaning: 'The Standard',
    body: "Foundational forms that define DANHOV's benchmark for excellence in gold work.",
    href: '/collection/norme',
  },
  {
    label: 'Carezza',
    value: 'carezza',
    meaning: 'The Caress',
    body: 'Delicate pavé and micro-setting work — softness woven into gold, touch made permanent.',
    href: '/collection/carezza',
  },
  {
    label: 'Per Lei',
    value: 'per-lei',
    meaning: 'For Her',
    body: 'Floral forms and feminine geometries, each piece created in devotion for singular women.',
    href: '/collection/per-lei',
  },
  {
    label: 'Petalo',
    value: 'petalo',
    meaning: 'The Petal',
    body: "Nature's most perfect architecture — organic petal forms blooming in 14k and 18k gold.",
    href: '/collection/petalo',
  },
  {
    label: 'Solo Filo',
    value: 'solo',
    meaning: 'Single Thread',
    body: 'A single continuous thread of gold — minimal, essential, unbroken as a promise.',
    href: '/collection/solo',
  },
  {
    label: 'Eleganza',
    value: 'eleganza',
    meaning: 'The Elegance',
    body: 'Refined simplicity. Designs that speak through restraint and perfection of proportion.',
    href: '/collection/eleganza',
  },
  {
    label: 'Couture',
    value: 'couture',
    meaning: 'The Sovereign',
    body: 'Statement pieces with presence. Worn not to become — but to declare what already is.',
    href: '/collection/couture',
  },
  {
    label: 'Unito',
    value: 'unito',
    meaning: 'United',
    body: 'Two forms joined as one. For love that is both distinct and inseparable.',
    href: '/collection/unito',
  },
  {
    label: 'The Life Path',
    value: 'life-path',
    meaning: 'Your Number, Your Sign',
    body: 'Enter the day you arrived. We calculate your life path number and your sign, then create an original design from both — a form no other birth date makes. Not your fate. A mirror.',
    href: '/life-path',
    isLifePath: true,
  },
];

// ── Pinned images (full-size, high-resolution) ────────────────────────────

const WY  = 'https://www.danhov.com/media/wysiwyg/new-home';
const PRD = 'https://www.danhov.com/media/catalog/product';
const SB  = 'https://wirbqklbygxuafelsqql.supabase.co/storage/v1/object/public/product-images/products';

const COLLECTION_IMAGES: Record<string, string> = {
  abbraccio: `${WY}/Untitled2-111822.png`,
  voltaggio:  `${WY}/IMG_20221123_124430.jpg`,
  classico:   `${WY}/img_collection_classico.jpg`,
  norme:      `${SB}/SORE569UH/14k_white/Norme%20de%20Danhov%20Engagement%20Ring%20for%20Women%20SORE569UH_1.jpg`,
  carezza:    `${WY}/img_collection_carezza.jpg`,
  'per-lei':  `${WY}/img_collection_per-lei.jpg`,
  petalo:     `${WY}/img_collection_petalo.jpg`,
  solo:       `${WY}/img_collection_solo-filo.jpg`,
  eleganza:   `${WY}/Untitled3-11182022.png`,
  couture:    `${WY}/img_collection_couture.jpg`,
  unito:      `${WY}/img_collection_unito.jpg`,
};

// Full-size product images (100–260 KB each, sourced from danhov.com catalog)
const WEDDING_PINNED = [
  `${PRD}/t/b/tb509va_wg_1.jpg`,
  `${PRD}/b/_/b_1_11_2_1.jpg`,
  `${PRD}/t/b/tb521va_rg_1.jpg`,
];

const FINE_PINNED = [
  `${PRD}/2/8/28646453_wg_1_1_1.jpg`,
  `${PRD}/3/6/36667168_3_rg_1.jpg`,
  `${PRD}/2/6/26544947_wg_1.jpg`,
];

const MENS_PINNED = [
  `${PRD}/2/_/2_2_1.jpg`,
  `${PRD}/2/_/2_12_2_1.jpg`,
  `${PRD}/r/_/r_2_25_2_1.jpg`,
  `${PRD}/r/_/r_2_27_1.jpg`,
];

// Fetch Supabase product images for hover cycling (pinned danhov.com image is always first)
async function getCollectionImages(): Promise<Record<string, string[]>> {
  try {
    const { data: all } = await supabaseAnon
      .from('products')
      .select('collection, images')
      .filter('categories', 'cs', JSON.stringify(['engagement']))
      .eq('is_active', true)
      .not('collection', 'is', null);

    const rows = all ?? [];
    const bestByCol: Record<string, string[]> = {};
    for (const p of rows) {
      const col = (p.collection as string | null)?.toLowerCase().trim();
      if (!col) continue;
      if (!Array.isArray(p.images) || p.images.length === 0) continue;
      const imgs = (p.images as string[]).slice(0, 6);
      if (!bestByCol[col] || imgs.length > bestByCol[col].length) {
        bestByCol[col] = imgs;
      }
    }
    return bestByCol;
  } catch {
    return {};
  }
}

// ── Main component ─────────────────────────────────────────────────────────

export default async function CategoryCardsSection() {
  // Supabase images supplement pinned danhov.com images for hover cycling.
  // Supabase images used for hover cycling; pinned danhov.com images are always shown first.
  const imageMap = await getCollectionImages();

  function mergeImages(pinnedFirst: string[], supabaseExtra: string[]): string[] {
    const deduped = supabaseExtra.filter(img => !pinnedFirst.includes(img));
    return [...pinnedFirst, ...deduped].slice(0, 8);
  }

  const engagementCards: EngagementCard[] = COLLECTIONS.map((col) => {
    if (col.isLifePath) {
      return {
        label: col.label, value: col.value, meaning: col.meaning,
        body: col.body, href: col.href, images: ['/life-path.png'],
        linkLabel: 'Find Your Path', isLifePath: true,
      };
    }
    const pinned = COLLECTION_IMAGES[col.value];
    const supabase = imageMap[col.value] ?? imageMap[col.label.toLowerCase()] ?? [];
    return {
      label: col.label, value: col.value, meaning: col.meaning,
      body: col.body, href: col.href,
      images: pinned ? mergeImages([pinned], supabase) : supabase,
      linkLabel: `Explore ${col.label}`,
      isLifePath: false,
    };
  });

  const categoryCards: EngagementCard[] = [
    {
      label: 'Wedding Bands',
      value: 'wedding',
      meaning: 'The Unbroken Circle',
      body: 'Two people. One unbroken form. Handcrafted bands made with the same intention as the moment they mark.',
      href: '/wedding-bands',
      images: WEDDING_PINNED,
      linkLabel: 'Browse Wedding Bands',
      isLifePath: false,
    },
    {
      label: 'Fine Jewelry',
      value: 'fine',
      meaning: 'The Daily Beautiful',
      body: 'Designed to be worn every day. Small enough to forget. Beautiful enough to remember forever.',
      href: '/fine-jewelry',
      images: FINE_PINNED,
      linkLabel: 'Browse Fine Jewelry',
      isLifePath: false,
    },
    {
      label: "Men's Jewelry",
      value: 'mens',
      meaning: 'The Worn Statement',
      body: 'A ring that carries a name. A band that asks nothing — and says everything.',
      href: '/mens',
      images: MENS_PINNED,
      linkLabel: "Browse Men's Jewelry",
      isLifePath: false,
    },
  ];

  return (
    <section id="engagement-rings" className="categories-section">
      <div className="categories-inner">
        <div className="categories-header">
          <span className="section-eyebrow">The Collections</span>
          <h2 className="section-title">Each name is a signpost</h2>
          <p className="categories-intro">
            For four decades, DANHOV&apos;s collections have carried Italian names.
            Each name was given for a reason. Each piece was made for a meaning.
          </p>
        </div>

        <CategoryGridClient
          engagementCards={[...engagementCards, ...categoryCards]}
        />
      </div>
    </section>
  );
}
