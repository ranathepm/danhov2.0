import Link from 'next/link';

const SHAPES = [
  {
    name: 'Round', value: 'ROUND', meaning: 'Wholeness, complete',
    svg: (
      <>
        <circle cx="28" cy="28" r="22" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="28,10 38,20 38,36 28,46 18,36 18,20" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.45" />
      </>
    ),
  },
  {
    name: 'Oval', value: 'OVAL', meaning: 'Soft eternity',
    svg: (
      <>
        <ellipse cx="28" cy="28" rx="16" ry="22" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="28,9 38,22 38,34 28,47 18,34 18,22" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Cushion', value: 'CUSHION', meaning: 'Held, supported',
    svg: (
      <>
        <rect x="7" y="7" width="42" height="42" rx="9" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="28,12 43,28 28,44 13,28" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Pear', value: 'PEAR', meaning: 'Flowing, like water',
    svg: (
      <>
        <path d="M28 6 C34 10 40 20 40 30 C40 40 34 50 28 50 C22 50 16 40 16 30 C16 20 22 10 28 6 Z" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <line x1="28" y1="6" x2="28" y2="50" stroke="#9b6b4a" strokeWidth="0.4" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Heart', value: 'HEART', meaning: 'Cannot be hidden',
    svg: (
      <>
        <path d="M28 48 C12 34 8 20 14 13 C19 8 24 10 28 15 C32 10 37 8 42 13 C48 20 44 34 28 48 Z" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <line x1="28" y1="15" x2="28" y2="48" stroke="#9b6b4a" strokeWidth="0.4" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Emerald', value: 'EMERALD', meaning: 'Clarity, depth',
    svg: (
      <>
        <polygon points="17,5 39,5 51,17 51,39 39,51 17,51 5,39 5,17" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="21,13 35,13 43,21 43,35 35,43 21,43 13,35 13,21" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Princess', value: 'PRINCESS', meaning: 'Sharp, sovereign',
    svg: (
      <>
        <rect x="8" y="8" width="40" height="40" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="28,12 44,28 28,44 12,28" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
        <line x1="8" y1="8" x2="48" y2="48" stroke="#9b6b4a" strokeWidth="0.35" opacity="0.35" />
      </>
    ),
  },
  {
    name: 'Marquise', value: 'MARQUISE', meaning: 'Reach, expansion',
    svg: (
      <>
        <path d="M28 8 L46 28 L28 48 L10 28 Z" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="28,14 40,28 28,42 16,28" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Radiant', value: 'RADIANT', meaning: 'Light in all directions',
    svg: (
      <>
        <polygon points="17,5 39,5 51,17 51,39 39,51 17,51 5,39 5,17" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="21,12 35,12 44,21 44,35 35,44 21,44 12,35 12,21" stroke="#9b6b4a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Asscher', value: 'ASSCHER', meaning: 'Stepped, ancient',
    svg: (
      <>
        <polygon points="20,6 36,6 50,20 50,36 36,50 20,50 6,36 6,20" stroke="#AC3438" strokeWidth="1.5" fill="rgba(172,52,56,0.05)" />
        <polygon points="24,14 32,14 38,20 38,36 32,42 24,42 18,36 18,20" stroke="#9b6b4a" strokeWidth="0.6" fill="none" opacity="0.4" />
        <circle cx="28" cy="28" r="5" fill="rgba(172,52,56,0.12)" />
      </>
    ),
  },
];

export default function FindFormSection() {
  return (
    <section className="findform-section">
      <div className="findform-section-inner">
        <div className="findform-section-header">
          <span className="section-eyebrow">Find Your Form</span>
          <h2 className="section-title">
            Light enters from the cracks<br />of <em>the darkness</em>
          </h2>
          <p className="findform-teaching">
            &ldquo;The diamond was created in the dark. Now it sparkles.&rdquo;
          </p>
          <p className="findform-intro">
            Each diamond shape lets light in differently. Round opens widest.
            Pear flows like water. Heart shows what cannot be hidden.
            The shape does not need to be chosen &mdash; it needs to be recognized.
          </p>
        </div>

        <div className="findform-grid">
          {SHAPES.map((s) => (
            <Link
              key={s.name}
              href={`/ring-builder/diamond?shape=${s.value}`}
              className="findform-card"
              aria-label={`Browse ${s.name} cut diamonds`}
            >
              <div className="findform-card-svg">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  {s.svg}
                </svg>
              </div>
              <span className="findform-card-name">{s.name}</span>
              <p className="findform-card-meaning">{s.meaning}</p>
            </Link>
          ))}
        </div>

        <div className="findform-cta-wrap">
          <Link href="/engagement-rings" className="btn-solid" style={{ marginLeft: 0 }}>
            Begin Your Search
          </Link>
          <span className="findform-cta-note">
            Or let our AI advisor guide you to your perfect form
          </span>
        </div>
      </div>
    </section>
  );
}
