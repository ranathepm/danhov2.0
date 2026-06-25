import Link from 'next/link';

const STEPS = [
  { num: '1', title: 'Be Still',    body: '"Close your eyes. Stop trying to design. Just listen."' },
  { num: '2', title: 'See It',      body: '"A form, a shape, a feeling, a stone — whatever comes."' },
  { num: '3', title: 'Describe It', body: '"Tell us what you saw. Jack reviews every one."' },
  { num: '4', title: 'We Make It',  body: '"Handcrafted in Los Angeles. Yours alone."' },
];

export default function CoCreateSection() {
  return (
    <section className="cocreate-section">
      <div className="cocreate-inner">
        <div className="cocreate-header">
          <span className="section-eyebrow">Design in Silence</span>
          <h2 className="section-title">
            Don&apos;t pick a ring.<br /><em>Receive one.</em>
          </h2>
          <p className="cocreate-statement">
            Most jewelers offer a catalog.{' '}
            <strong>DANHOV offers a process.</strong>
          </p>
          <p className="cocreate-statement">
            Describe the ring you see within. Our guided creator helps shape your
            vision &mdash; and Jack&apos;s Los Angeles workshop brings it into gold and platinum.
          </p>
        </div>

        <div className="cocreate-steps">
          {STEPS.map((step) => (
            <div key={step.num} className="cocreate-step">
              <span className="cocreate-step-num">{step.num}</span>
              <span className="cocreate-step-title">{step.title}</span>
              <p className="cocreate-step-body">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="cocreate-cta-wrap">
          <Link href="/ring-builder" className="btn-solid" style={{ marginLeft: 0, padding: '18px 52px' }}>
            Design in Silence
          </Link>
        </div>
      </div>
    </section>
  );
}
