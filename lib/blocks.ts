import { supabaseAnon } from '@/lib/supabase/anon';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'cta'
  | 'quote'
  | 'divider'
  | 'spacer';

export type Block = {
  id: string;
  page_slug: string;
  position: number;
  type: BlockType;
  data: Record<string, unknown>;
  is_visible: boolean;
};

export const PAGE_SLUGS = [
  { slug: 'home', label: 'Home page', path: '/' },
  { slug: 'engagement-rings', label: 'Engagement Rings', path: '/engagement-rings' },
  { slug: 'wedding-bands', label: 'Wedding Bands', path: '/wedding-bands' },
  { slug: 'fine-jewelry', label: 'Fine Jewelry', path: '/fine-jewelry' },
  { slug: 'mens', label: "Men's Jewelry", path: '/mens' },
  { slug: 'faq', label: 'FAQ', path: '/faq' },
] as const;

export const BLOCK_TYPES: { type: BlockType; label: string; description: string }[] = [
  { type: 'heading', label: 'Heading', description: 'Section title with optional eyebrow' },
  { type: 'paragraph', label: 'Paragraph', description: 'A block of text' },
  { type: 'image', label: 'Image', description: 'Upload or paste an image URL' },
  { type: 'video', label: 'Video', description: 'MP4 / YouTube / Vimeo' },
  { type: 'cta', label: 'Call-to-action', description: 'A bold button linking somewhere' },
  { type: 'quote', label: 'Quote', description: 'A philosophy quote with attribution' },
  { type: 'divider', label: 'Divider', description: 'A thin gold line' },
  { type: 'spacer', label: 'Spacer', description: 'Vertical whitespace' },
];

export const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  heading: { eyebrow: '', text: 'New heading', level: 2, align: 'center' },
  paragraph: { text: 'New paragraph of copy.', align: 'center' },
  image: { url: '', alt: '', caption: '', full_width: false },
  video: { url: '', caption: '' },
  cta: { label: 'Learn more', href: '/', style: 'primary' },
  quote: { text: 'A truth worth wearing.', attribution: '' },
  divider: {},
  spacer: { size: 'md' },
};

/**
 * Fetch all visible blocks for a page, ordered by position. Server-only.
 */
export async function fetchPageBlocks(pageSlug: string): Promise<Block[]> {
  const { data, error } = await supabaseAnon
    .from('page_blocks')
    .select('id, page_slug, position, type, data, is_visible')
    .eq('page_slug', pageSlug)
    .eq('is_visible', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('fetchPageBlocks error', error);
    return [];
  }
  return (data ?? []) as Block[];
}
