import Link from 'next/link';

const SHAPES = [
  {
    name: 'Round', value: 'ROUND', meaning: 'Wholeness, complete',
    svg: (
      <>
        <circle cx="28" cy="28" r="22" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,12 40,22 40,34 28,44 16,34 16,22" stroke="#b8923a" strokeWidth="0.6" fill="none" opacity="0.5" />
        <line x1="16" y1="22" x2="40" y2="34" stroke="#b8923a" strokeWidth="0.4" opacity="0.4" />
        <line x1="40" y1="22" x2="16" y2="34" stroke="#b8923a" strokeWidth="0.4" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Oval', value: 'OVAL', meaning: 'Soft eternity',
    svg: (
      <>
        <ellipse cx="28" cy="28" rx="16" ry="22" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,10 38,22 38,34 28,46 18,34 18,22" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="18" y1="28" x2="38" y2="28" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Cushion', value: 'CUSHION', meaning: 'Held, supported',
    svg: (
      <>
        <rect x="10" y="10" width="36" height="36" rx="6" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,14 42,28 28,42 14,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="10" y1="10" x2="46" y2="46" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
        <line x1="46" y1="10" x2="10" y2="46" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Pear', value: 'PEAR', meaning: 'Flowing, like water',
    svg: (
      <>
        <path d="M28 12 C20 12 12 22 12 32 C12 42 20 50 28 50 C36 50 44 42 44 32 C44 22 36 12 28 12 Z" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <ellipse cx="28" cy="32" rx="10" ry="14" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="28" y1="12" x2="28" y2="50" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Heart', value: 'HEART', meaning: 'Cannot be hidden',
    svg: (
      <>
        <path d="M28 50 C20 38 12 32 12 22 C12 15 18 12 24 14 C26 15 28 18 28 18 C28 18 30 15 32 14 C38 12 44 15 44 22 C44 32 36 38 28 50 Z" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <line x1="28" y1="18" x2="28" y2="50" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Emerald', value: 'EMERALD', meaning: 'Clarity, depth',
    svg: (
      <>
        <rect x="14" y="10" width="28" height="36" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,16 38,28 28,40 18,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="14" y1="10" x2="42" y2="46" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Princess', value: 'PRINCESS', meaning: 'Sharp, sovereign',
    svg: (
      <>
        <rect x="14" y="14" width="28" height="28" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,18 38,28 28,38 18,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="14" y1="14" x2="42" y2="42" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
        <line x1="42" y1="14" x2="14" y2="42" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Marquise', value: 'MARQUISE', meaning: 'Reach, expansion',
    svg: (
      <>
        <path d="M28 8 L42 28 L28 48 L14 28 Z" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="28,16 36,28 28,40 20,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="14" y1="28" x2="42" y2="28" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Radiant', value: 'RADIANT', meaning: 'Light in all directions',
    svg: (
      <>
        <polygon points="14,14 42,14 46,28 42,42 14,42 10,28" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="20,20 36,20 38,28 36,36 20,36 18,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <line x1="14" y1="14" x2="42" y2="42" stroke="#b8923a" strokeWidth="0.3" opacity="0.4" />
      </>
    ),
  },
  {
    name: 'Asscher', value: 'ASSCHER', meaning: 'Stepped, ancient',
    svg: (
      <>
        <polygon points="20,12 36,12 44,28 36,44 20,44 12,28" stroke="#8b2a2a" strokeWidth="1.5" fill="rgba(184,146,58,0.05)" />
        <polygon points="24,18 32,18 38,28 32,38 24,38 18,28" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.5" />
        <circle cx="28" cy="28" r="4" fill="rgba(184,146,58,0.2)" />
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
            Light enters from the cracks of <em>the darkness.</em>
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
            Or let the form find you &mdash; design in silence
          </span>
        </div>
      </div>
    </section>
  );
}
