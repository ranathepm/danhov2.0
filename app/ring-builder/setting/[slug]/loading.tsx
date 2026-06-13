import '../../builder.css';

export default function SettingDetailLoading() {
  return (
    <main className="sdd-loading" aria-hidden="true">
      {/* Stepper */}
      <div className="sdd-loading-stepper" />

      {/* Back link */}
      <div className="sdd-loading-back" />

      <div className="sdd-loading-layout">
        {/* Gallery */}
        <div className="sdd-loading-gallery">
          <div className="sdd-loading-main-img" />
          <div className="sdd-loading-thumbs">
            <div className="sdd-loading-thumb" />
            <div className="sdd-loading-thumb" />
            <div className="sdd-loading-thumb" />
            <div className="sdd-loading-thumb" />
          </div>
        </div>

        {/* Panel */}
        <div className="sdd-loading-panel">
          <div className="sdd-loading-line sdd-loading-line--title" />
          <div className="sdd-loading-line sdd-loading-line--sku" />
          <div className="sdd-loading-line sdd-loading-line--collection" />

          <div className="sdd-loading-section-head" style={{ marginTop: 16 }} />
          <div className="sdd-loading-swatches">
            <div className="sdd-loading-swatch" />
            <div className="sdd-loading-swatch" />
            <div className="sdd-loading-swatch" />
            <div className="sdd-loading-swatch" />
            <div className="sdd-loading-swatch" />
          </div>

          <div className="sdd-loading-price-row" style={{ marginTop: 8 }} />
          <div className="sdd-loading-cta" />
          <div className="sdd-loading-cta sdd-loading-cta--secondary" />
          <div className="sdd-loading-cta sdd-loading-cta--secondary" />
        </div>
      </div>
    </main>
  );
}
