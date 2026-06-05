import Link from 'next/link';

const STEPS = [
  { num: '01', title: 'Be Still',    body: '"Close your eyes. Stop trying to design. Just listen."' },
  { num: '02', title: 'See It',      body: '"A form, a shape, a feeling, a stone — whatever comes."' },
  { num: '03', title: 'Describe It', body: '"Tell us what you saw. Jack reviews every one."' },
  { num: '04', title: 'We Make It',  body: '"Handcrafted in Los Angeles. Yours alone."' },
];

export default function CoCreateSection() {
  return (
    <section className="cocreate-section">
      <div className="cocreate-inner">
        <div className="cocreate-header">
          <span className="section-eyebrow">A Different Way to Buy a Ring</span>
          <h2 className="section-title">
            Don&apos;t pick a ring.<br /><em>Receive one.</em>
          </h2>
          <p className="cocreate-statement">
            Most jewelers offer a catalog.{' '}
            <strong>DANHOV offers a process.</strong>
          </p>
          <p className="cocreate-statement">
            You close your eyes. You see what wants to be made. We help you bring it
            into form &mdash; with intention, in silence, in 18 karat gold.
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
            Build with Intention
          </Link>
        </div>
      </div>
    </section>
  );
}
