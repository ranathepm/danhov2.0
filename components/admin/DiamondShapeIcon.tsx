/**
 * Compact line-art glyphs for each diamond shape, keyed by the slugs in
 * DIAMOND_SHAPES (lib/stone-math). Rendered next to the shape dropdown in the
 * product editor so the studio sees the silhouette of the shape they pick —
 * the kind of visual cue a professional jewelry CMS provides.
 *
 * Each glyph is a 24×24 stroked outline that inherits `currentColor`.
 */

type Props = { shape: string | null; size?: number; className?: string };

const PATHS: Record<string, React.ReactNode> = {
  round: <circle cx="12" cy="12" r="8.5" />,
  princess: <rect x="4.5" y="4.5" width="15" height="15" rx="0.5" />,
  cushion: <rect x="4.5" y="4.5" width="15" height="15" rx="5" />,
  oval: <ellipse cx="12" cy="12" rx="6" ry="8.5" />,
  emerald: <rect x="6.5" y="3.5" width="11" height="17" rx="0.5" />,
  pear: <path d="M12 3.5c3 4 5.5 6 5.5 9.5a5.5 5.5 0 1 1-11 0C6.5 9.5 9 7.5 12 3.5Z" />,
  marquise: <path d="M12 3.5c4 3 6.5 6 6.5 8.5S16 17.5 12 20.5C8 17.5 5.5 14.5 5.5 12S8 6.5 12 3.5Z" />,
  asscher: (
    <path d="M8 4.5h8L19.5 8v8L16 19.5H8L4.5 16V8L8 4.5Z" />
  ),
  radiant: (
    <path d="M8 4.5h8L19.5 8v8L16 19.5H8L4.5 16V8L8 4.5Z" />
  ),
  heart: (
    <path d="M12 19.5C7 16 4.5 13 4.5 9.8 4.5 7.4 6.3 5.5 8.6 5.5c1.5 0 2.7.8 3.4 2 .7-1.2 1.9-2 3.4-2 2.3 0 4.1 1.9 4.1 4.3 0 3.2-2.5 6.2-7.5 9.7Z" />
  ),
  trillion: <path d="M12 4.5 20 19.5H4L12 4.5Z" />,
  baguette: <rect x="8.5" y="3.5" width="7" height="17" rx="0.5" />,
};

export default function DiamondShapeIcon({ shape, size = 18, className }: Props) {
  const glyph = (shape && PATHS[shape]) || PATHS.round;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
}
