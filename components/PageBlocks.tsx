import Link from 'next/link';
import Image from 'next/image';
import { fetchPageBlocks, type Block } from '@/lib/blocks';

/**
 * Renders all visible blocks for a page slug. Drop this anywhere a page
 * should support admin-managed content. Renders nothing if there are no
 * blocks — the page falls back to its hard-coded sections.
 */
export default async function PageBlocks({
  pageSlug,
  className,
}: {
  pageSlug: string;
  className?: string;
}) {
  const blocks = await fetchPageBlocks(pageSlug);
  if (blocks.length === 0) return null;
  return (
    <section className={`page-blocks${className ? ` ${className}` : ''}`}>
      {blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} />
      ))}
    </section>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  const d = block.data as Record<string, unknown>;
  const text = (k: string) => (d[k] as string) ?? '';
  const num = (k: string) => (d[k] as number) ?? 0;
  const bool = (k: string) => Boolean(d[k]);

  switch (block.type) {
    case 'heading': {
      const level = Math.min(3, Math.max(1, num('level') || 2));
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3');
      const align = text('align') || 'center';
      const eyebrow = text('eyebrow');
      return (
        <div className={`pb-block pb-heading pb-align-${align}`}>
          {eyebrow && <span className="pb-eyebrow">{eyebrow}</span>}
          <Tag className={`pb-h pb-h-${level}`}>{text('text')}</Tag>
        </div>
      );
    }

    case 'paragraph': {
      const align = text('align') || 'center';
      return (
        <p className={`pb-block pb-paragraph pb-align-${align}`}>{text('text')}</p>
      );
    }

    case 'image': {
      const url = text('url');
      if (!url) return null;
      const fullWidth = bool('full_width');
      return (
        <figure className={`pb-block pb-image${fullWidth ? ' is-full' : ''}`}>
          <Image
            src={url}
            alt={text('alt')}
            width={fullWidth ? 1600 : 1200}
            height={fullWidth ? 900 : 1200}
            sizes={fullWidth ? '100vw' : '(max-width: 900px) 100vw, 1000px'}
            className="pb-img"
          />
          {text('caption') && <figcaption className="pb-caption">{text('caption')}</figcaption>}
        </figure>
      );
    }

    case 'video': {
      const url = text('url');
      if (!url) return null;
      const embedSrc = videoEmbed(url);
      return (
        <figure className="pb-block pb-video">
          {embedSrc ? (
            <div className="pb-video-frame">
              <iframe
                src={embedSrc}
                title={text('caption') || 'Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video controls src={url} className="pb-video-native" />
          )}
          {text('caption') && <figcaption className="pb-caption">{text('caption')}</figcaption>}
        </figure>
      );
    }

    case 'cta': {
      const style = text('style') === 'secondary' ? 'btn-primary' : 'btn-solid';
      const href = text('href') || '#';
      const external = /^https?:\/\//.test(href);
      const label = text('label') || 'Learn more';
      return (
        <div className="pb-block pb-cta">
          {external ? (
            <a href={href} className={style} target="_blank" rel="noopener noreferrer">{label}</a>
          ) : (
            <Link href={href} className={style}>{label}</Link>
          )}
        </div>
      );
    }

    case 'quote': {
      return (
        <blockquote className="pb-block pb-quote">
          <p>&ldquo;{text('text')}&rdquo;</p>
          {text('attribution') && <cite>{text('attribution')}</cite>}
        </blockquote>
      );
    }

    case 'divider':
      return <hr className="pb-block pb-divider" />;

    case 'spacer': {
      const size = text('size') || 'md';
      return <div className={`pb-block pb-spacer pb-spacer-${size}`} aria-hidden="true" />;
    }

    default:
      return null;
  }
}

function videoEmbed(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d{6,})/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
