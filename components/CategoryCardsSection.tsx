import Link from 'next/link';

const COLLECTIONS = [
  {
    italian: 'Abbraccio',
    meaning: 'The Embrace',
    teaching: '"The first arms that hold you are your own."',
    body: 'Before you embrace another, embrace yourself. The ring is the embrace made gold — a quiet practice of self-love that prepares you for all other love.',
    href: '/engagement-rings',
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="36" stroke="#b8923a" strokeWidth="8" fill="none" />
        <circle cx="60" cy="45" r="6" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.5" />
      </svg>
    ),
  },
  {
    italian: 'Carezza',
    meaning: 'The Caress',
    teaching: '"You see yourself in others."',
    body: 'A touch so soft it asks nothing in return. What you touch with tenderness, you become. The ring is a daily reminder — be soft with what you meet.',
    href: '/engagement-rings',
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="38" stroke="#b8923a" strokeWidth="6" fill="none" />
        <circle cx="60" cy="46" r="7" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.5" />
        <circle cx="60" cy="46" r="11" stroke="#d4b260" strokeWidth="0.4" fill="none" opacity="0.5" />
      </svg>
    ),
  },
  {
    italian: 'Classico',
    meaning: 'The Classic',
    teaching: '"The past, manifesting in the now."',
    body: 'What is timeless was never new and is never old. Forms worn for generations — not as nostalgia, but as proof that some shapes are eternal because they were already true.',
    href: '/engagement-rings',
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="36" stroke="#b8923a" strokeWidth="7" fill="none" />
        <circle cx="60" cy="44" r="9" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.6" />
      </svg>
    ),
  },
  {
    italian: 'Couture',
    meaning: 'The Sovereign',
    teaching: '"You are already royalty."',
    body: 'The crown was never something to earn — it was something to remember. Wear the ring not to become, but to recognize what was always already there.',
    href: '/engagement-rings',
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="38" stroke="#b8923a" strokeWidth="6" fill="none" />
        <circle cx="60" cy="46" r="10" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.6" />
        <path d="M50 46 Q60 30 70 46" stroke="#b8923a" strokeWidth="0.5" fill="none" opacity="0.4" />
      </svg>
    ),
  },
  {
    italian: 'Éclat',
    meaning: 'The Brilliance',
    teaching: '"The diamond was created in the dark. Now it sparkles."',
    body: 'In darkness, under pressure, the diamond finds its form. What is most brilliant in you was shaped by what was most difficult. This ring is for those who have been through the dark.',
    href: '/engagement-rings',
    svg: (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="36" stroke="#b8923a" strokeWidth="6" fill="none" />
        <polygon points="60,34 72,52 88,58 72,64 60,82 48,64 32,58 48,52" stroke="#b8923a" strokeWidth="0.7" fill="rgba(184,146,58,0.08)" />
        <circle cx="60" cy="58" r="5" fill="#fffaf3" stroke="#b8923a" strokeWidth="0.4" />
      </svg>
    ),
  },
];

export default function CategoryCardsSection() {
  return (
    <section className="categories-section">
      <div className="categories-inner">
        <div className="categories-header">
          <span className="section-eyebrow">The Collections</span>
          <h2 className="section-title">Each name is a <em>signpost</em></h2>
          <p className="categories-intro">
            For four decades, DANHOV&apos;s collections have carried Italian names.
            Each name was given for a reason. Each piece was made for a meaning.
            These are not styles — they are quiet practices.
          </p>
        </div>

        <div className="categories-grid">
          {COLLECTIONS.map((col) => (
            <Link key={col.italian} href={col.href} className="cat-card">
              <div className="cat-photo cat-photo--svg">
                {col.svg}
              </div>
              <div className="cat-info">
                <span className="cat-eyebrow">{col.italian}</span>
                <p className="cat-meaning">{col.meaning}</p>
                <p className="cat-teaching">{col.teaching}</p>
                <p className="cat-body">{col.body}</p>
                <span className="cat-link">Explore {col.italian} &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
