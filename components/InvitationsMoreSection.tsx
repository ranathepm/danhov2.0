import Link from 'next/link';

export default function InvitationsMoreSection() {
  return (
    <section className="invmore-section">
      <div className="invmore-header">
        <span className="section-eyebrow">What We Offer</span>
        <h2 className="section-title">More than a <em>store</em></h2>
      </div>

      <div className="invmore-grid">
        <Link href="/ring-builder" className="invmore-card">
          <div className="invmore-icon">✦</div>
          <span className="invmore-label">AI Ring Creator</span>
          <h3 className="invmore-name">Design in <em>Silence</em></h3>
          <p className="invmore-body">
            &ldquo;You can see your own design in silence. We can make it.&rdquo;
          </p>
          <span className="invmore-link">Begin &rarr;</span>
        </Link>

        <button
          type="button"
          className="invmore-card invmore-card--btn"
          data-dnh="I'd like to book a virtual appointment with DANHOV to discuss a ring."
        >
          <div className="invmore-icon">◯</div>
          <span className="invmore-label">Virtual Consultation</span>
          <h3 className="invmore-name">Speak with <em>us</em></h3>
          <p className="invmore-body">
            &ldquo;Connect in a sacred space. Receive guidance from a spiritual jewelry expert.&rdquo;
          </p>
          <span className="invmore-link">Book Now &rarr;</span>
        </button>

        <Link href="/engagement-rings" className="invmore-card">
          <div className="invmore-icon">∷</div>
          <span className="invmore-label">The Collections</span>
          <h3 className="invmore-name">The <em>Signposts</em></h3>
          <p className="invmore-body">
            &ldquo;Each collection carries a name given for a reason. Each piece made for a meaning.&rdquo;
          </p>
          <span className="invmore-link">Explore &rarr;</span>
        </Link>
      </div>
    </section>
  );
}
