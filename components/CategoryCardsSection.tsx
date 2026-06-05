import Image from 'next/image';
import Link from 'next/link';

const CATEGORIES = [
  {
    eyebrow: 'Engagement Rings',
    title: <>The ring that <em>begins</em> it all</>,
    body: 'Sacred geometry in gold. Every spiral, every stone, every proportion — made by hand in Los Angeles since 1984. A ring that carries the signature of the universe.',
    image: '/triad-galaxy.png',
    href: '/engagement-rings',
  },
  {
    eyebrow: 'Wedding Bands',
    title: <>Two becoming <em>one</em></>,
    body: 'The circle that begins exactly where it ends. Crafted in 14k or 18k gold — for those who understand that love is something larger than two.',
    image: '/triad-ring.jpg',
    href: '/wedding-bands',
  },
  {
    eyebrow: 'Fine Jewelry',
    title: <>Worn with <em>intention</em></>,
    body: 'Necklaces, earrings, and bracelets that carry the same sacred geometry as every DANHOV ring — for those who wear their philosophy every day.',
    image: '/phil-2.png',
    href: '/fine-jewelry',
  },
  {
    eyebrow: "Men's Jewelry",
    title: <>Bold <em>sacred</em> geometry</>,
    body: 'In silence, the ring was formed. Strong lines, intentional weight, and the same handcrafted care — for those who travel inward.',
    image: '/phil-6.jpg',
    href: '/mens',
  },
  {
    eyebrow: 'The Life Path',
    title: <>Your number, <em>your sign</em></>,
    body: 'Enter the day you arrived. We calculate your life path number and sign, then create a design from both — a form no other birth date can make. Not your fate. A mirror.',
    image: '/triad-galaxy-cut.png',
    href: null,
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
            For four decades, DANHOV&apos;s work has carried meaning in every form.
            These are not just styles &mdash; they are quiet invitations.
          </p>
        </div>

        <div className="categories-grid">
          {CATEGORIES.map((cat) => {
            const content = (
              <>
                <div className="cat-photo">
                  <Image
                    src={cat.image}
                    alt={cat.eyebrow}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 1100px) 50vw, 33vw"
                  />
                </div>
                <div className="cat-info">
                  <span className="cat-eyebrow">{cat.eyebrow}</span>
                  <h3 className="cat-title">{cat.title}</h3>
                  <p className="cat-body">{cat.body}</p>
                  <span className="cat-link">
                    {cat.href ? 'Explore Collection →' : 'Coming Soon'}
                  </span>
                </div>
              </>
            );

            return cat.href ? (
              <Link key={cat.eyebrow} href={cat.href} className="cat-card">
                {content}
              </Link>
            ) : (
              <div key={cat.eyebrow} className="cat-card cat-card--inert">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
