import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BLOG_POSTS } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Blog · DANHOV Jewelry',
  description:
    'Tips, guides, and inspiration from the DANHOV atelier — engagement ring advice, wedding band trends, diamond guides, and stories from Los Angeles.',
  alternates: { canonical: '/blog' },
};

const CATEGORIES = ['All', 'Engagement Rings', 'Wedding Bands', 'Diamonds', 'Fine Jewelry', 'Proposal', "Mother's Day"];

export default function BlogPage() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <main className="blog-page">
      <style>{`
        .blog-page { font-family: 'Jost', sans-serif; color: #1a1410; background: #faf6f1; }

        .blog-header {
          background: linear-gradient(160deg, #1a1410 0%, #2c1f18 60%, #3d2a20 100%);
          padding: 100px 24px 80px; text-align: center; position: relative; overflow: hidden;
        }
        .blog-header::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 50% 40% at 50% 70%, rgba(184,146,58,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .blog-eyebrow { display: block; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #b8923a; margin-bottom: 16px; }
        .blog-header h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 5vw, 56px); font-weight: 400; color: #faf6f1; margin: 0 0 16px; line-height: 1.15; }
        .blog-header-sub { font-size: 15px; color: #c4b8ad; max-width: 480px; margin: 0 auto; line-height: 1.6; }

        .blog-filter { background: #fff; border-bottom: 1px solid #ede8e2; padding: 0 24px; }
        .blog-filter-inner { max-width: 1100px; margin: 0 auto; display: flex; gap: 0; overflow-x: auto; scrollbar-width: none; }
        .blog-filter-inner::-webkit-scrollbar { display: none; }
        .blog-cat-item { font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #8a7f76; padding: 18px 20px; border-bottom: 2px solid transparent; white-space: nowrap; transition: color 0.15s, border-color 0.15s; }
        .blog-cat-item:first-child { border-color: #b8923a; color: #1a1410; }

        .blog-featured { max-width: 1100px; margin: 0 auto; padding: 64px 24px 0; }
        .blog-featured-card { background: #fff; border: 1px solid #ede8e2; border-radius: 10px; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
        .blog-featured-img { min-height: 360px; position: relative; background: linear-gradient(135deg, #1a1410 0%, #3d2a20 50%, #6b4d3a 100%); display: flex; align-items: center; justify-content: center; }
        .blog-featured-body { padding: 48px 40px; display: flex; flex-direction: column; justify-content: center; }
        .blog-post-cat { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8923a; margin-bottom: 16px; display: block; }
        .blog-featured-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(22px, 3vw, 34px); font-weight: 400; color: #1a1410; margin: 0 0 16px; line-height: 1.25; }
        .blog-featured-excerpt { font-size: 15px; color: #6b5e57; line-height: 1.7; margin-bottom: 28px; }
        .blog-featured-meta { font-size: 12px; color: #9c8f86; margin-bottom: 24px; }
        .blog-featured-link { display: inline-block; color: #b8923a; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; border-bottom: 1px solid rgba(184,146,58,0.35); padding-bottom: 2px; transition: border-color 0.15s; }
        .blog-featured-link:hover { border-color: #b8923a; }

        .blog-grid-section { max-width: 1100px; margin: 0 auto; padding: 56px 24px 80px; }
        .blog-grid-label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a7f76; margin-bottom: 32px; display: block; }
        .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px; }
        .blog-card { background: #fff; border: 1px solid #ede8e2; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: box-shadow 0.18s, transform 0.18s; }
        .blog-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .blog-card-img { height: 200px; position: relative; background: linear-gradient(135deg, #1a1410 0%, #3d2a20 60%, #6b4d3a 100%); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .blog-card-img img { object-fit: cover; }
        .blog-card-img svg { opacity: 0.25; }
        .blog-card-body { padding: 24px; flex: 1; display: flex; flex-direction: column; }
        .blog-card-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 400; color: #1a1410; margin: 0 0 10px; line-height: 1.3; }
        .blog-card-excerpt { font-size: 13.5px; color: #6b5e57; line-height: 1.65; flex: 1; margin-bottom: 16px; }
        .blog-card-meta { font-size: 11px; color: #9c8f86; }
        .blog-card-read { display: inline-block; color: #b8923a; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid rgba(184,146,58,0.3); padding-bottom: 1px; margin-top: 14px; }

        .blog-newsletter { background: linear-gradient(135deg, #1a1410 0%, #2c1f18 100%); padding: 64px 24px; text-align: center; }
        .blog-newsletter h2 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 400; color: #faf6f1; margin-bottom: 12px; }
        .blog-newsletter p { font-size: 14px; color: #c4b8ad; margin-bottom: 32px; }
        .blog-newsletter-form { display: flex; gap: 12px; max-width: 420px; margin: 0 auto; }
        .blog-newsletter-input { flex: 1; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); border-radius: 999px; padding: 12px 20px; font-size: 14px; font-family: 'Jost', sans-serif; color: #faf6f1; outline: none; transition: border-color 0.15s; }
        .blog-newsletter-input::placeholder { color: #8a7f76; }
        .blog-newsletter-btn { background: #b8923a; color: #fff; border: none; border-radius: 999px; padding: 12px 24px; font-size: 12px; font-family: 'Jost', sans-serif; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .blog-newsletter-btn:hover { background: #9a7830; }

        @media (max-width: 768px) {
          .blog-featured-card { grid-template-columns: 1fr; }
          .blog-featured-img { min-height: 220px; }
          .blog-featured-body { padding: 28px 24px; }
          .blog-newsletter-form { flex-direction: column; align-items: stretch; }
        }
      `}</style>

      <section className="blog-header">
        <span className="blog-eyebrow">DANHOV Blog</span>
        <h1>Tips, Stories &amp; Inspiration</h1>
        <p className="blog-header-sub">
          Engagement ring guides, wedding band trends, diamond advice, and stories from the DANHOV atelier in Los Angeles.
        </p>
      </section>

      <nav className="blog-filter" aria-label="Blog categories">
        <div className="blog-filter-inner">
          {CATEGORIES.map((c) => (
            <span key={c} className="blog-cat-item">{c}</span>
          ))}
        </div>
      </nav>

      {/* Featured post */}
      <div className="blog-featured">
        <div className="blog-featured-card">
          <div className="blog-featured-img">
            {featured.image ? (
              <Image src={featured.image} alt={featured.title} fill style={{ objectFit: 'cover' }} unoptimized />
            ) : (
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <circle cx="40" cy="40" r="28" stroke="#b8923a" strokeWidth="0.8"/>
                <path d="M40 14 Q55 27 55 40 Q55 53 40 66 Q25 53 25 40 Q25 27 40 14Z" stroke="#b8923a" strokeWidth="0.5"/>
                <circle cx="40" cy="14" r="3" fill="#b8923a"/>
              </svg>
            )}
          </div>
          <div className="blog-featured-body">
            <span className="blog-post-cat">{featured.category} · Featured</span>
            <h2 className="blog-featured-title">{featured.title}</h2>
            <p className="blog-featured-excerpt">{featured.excerpt}</p>
            <p className="blog-featured-meta">{featured.date}</p>
            <Link href={`/blog/${featured.slug}`} className="blog-featured-link">
              Read More &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <section className="blog-grid-section">
        <span className="blog-grid-label">All Posts ({BLOG_POSTS.length})</span>
        <div className="blog-grid">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
              <div className="blog-card-img">
                {post.image ? (
                  <Image src={post.image} alt={post.title} fill style={{ objectFit: 'cover' }} unoptimized />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <circle cx="24" cy="24" r="16" stroke="#b8923a" strokeWidth="0.7"/>
                    <circle cx="24" cy="10" r="2" fill="#b8923a"/>
                  </svg>
                )}
              </div>
              <div className="blog-card-body">
                <span className="blog-post-cat">{post.category}</span>
                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <p className="blog-card-meta">{post.date}</p>
                <span className="blog-card-read">Read More &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="blog-newsletter">
        <h2>Stay Inspired</h2>
        <p>New articles, collection launches, and jewelry guides — delivered to your inbox.</p>
        <form className="blog-newsletter-form" action="#">
          <input className="blog-newsletter-input" type="email" placeholder="your@email.com" aria-label="Email address" />
          <button type="submit" className="blog-newsletter-btn">Subscribe</button>
        </form>
      </section>
    </main>
  );
}
