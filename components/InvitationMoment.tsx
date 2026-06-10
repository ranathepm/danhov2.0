import Link from 'next/link';

export default function InvitationMoment() {
  return (
    <section className="inv-moment-section">
      <div className="inv-moment-inner">
        <span className="inv-eyebrow">The DANHOV Invitation</span>
        <div className="inv-rule" />
        <h2 className="inv-headline">
          What do<br />you <em>see?</em>
        </h2>
        <Link href="/ring-builder" className="btn-solid inv-cta" style={{ marginLeft: 0 }}>
          Design in Silence
        </Link>
        <span className="inv-note">
          &ldquo;You can see your own design in silence. We can make it.&rdquo;
        </span>
      </div>
    </section>
  );
}
