'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DesignInSilenceCard() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleBrowseCollection = (e: React.MouseEvent) => {
    setOpen(false);
    if (pathname === '/') {
      e.preventDefault();
      setTimeout(() => {
        document.getElementById('engagement-rings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <>
      {/* Card that opens the modal */}
      <button
        type="button"
        className="invmore-card invmore-card--btn"
        onClick={() => setOpen(true)}
      >
        <div className="invmore-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M12 3l1.5 4.5h4.5l-3.5 2.5 1.5 4.5L12 12l-4 2.5 1.5-4.5L6 7.5h4.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        <span className="invmore-label">Guided Ring Creator</span>
        <h3 className="invmore-name">Design in <em>Silence</em></h3>
        <p className="invmore-body">
          Describe the ring you see within. Our guided creator shapes your vision — Jack&apos;s workshop brings it to life.
        </p>
        <span className="invmore-link">Begin &rarr;</span>
      </button>

      {/* Two-panel modal */}
      {open && (
        <div
          className="dis-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Design in Silence"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="dis-modal">
            <button
              className="dis-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>

            <div className="dis-modal-header">
              <p className="dis-modal-sub">Choose your path</p>
              <h2 className="dis-modal-title">Design in <em>Silence</em></h2>
              <p className="dis-modal-tagline">
                Two ways to find your form — create something entirely your own, or discover the one that already speaks to you.
              </p>
            </div>

            <div className="dis-panels">
              {/* Panel 1 — Create Your Own */}
              <div className="dis-panel">
                <div className="dis-panel-icon">✦</div>
                <span className="dis-panel-label">Guided Creator</span>
                <h3 className="dis-panel-title">
                  Create<br />Your Own
                </h3>
                <p className="dis-panel-body">
                  Describe the ring you see within — a feeling, a word, a shape. Our guided creator helps you find the form. Jack&apos;s Los Angeles workshop brings it into gold.
                </p>
                <Link
                  href="/ring-builder"
                  className="dis-panel-cta"
                  onClick={() => setOpen(false)}
                >
                  Open Ring Designer &rarr;
                </Link>
              </div>

              {/* Panel 2 — From Our Collection */}
              <div className="dis-panel">
                <div className="dis-panel-icon">◇</div>
                <span className="dis-panel-label">Our Collections</span>
                <h3 className="dis-panel-title">
                  Choose from<br />Our Collection
                </h3>
                <p className="dis-panel-body">
                  Eleven collections. Four decades of craft. Each piece begins with a name given in intention — find the form that already speaks to you.
                </p>
                <Link
                  href="/#engagement-rings"
                  className="dis-panel-cta"
                  onClick={handleBrowseCollection}
                >
                  Browse All Collections &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
