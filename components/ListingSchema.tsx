import { buildBreadcrumb, jsonLdScript } from '@/lib/seo';

type Props = {
  category: 'engagement' | 'wedding' | 'fine' | 'mens';
  title: string;
};

const CATEGORY_HREF: Record<Props['category'], string> = {
  engagement: '/engagement-rings',
  wedding: '/wedding-bands',
  fine: '/fine-jewelry',
  mens: '/mens',
};

export default function ListingSchema({ category, title }: Props) {
  const breadcrumb = buildBreadcrumb([
    { name: 'Home', url: '/' },
    { name: title, url: CATEGORY_HREF[category] },
  ]);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdScript(breadcrumb)}
    />
  );
}
