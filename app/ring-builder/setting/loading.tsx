import '../builder.css';

export default function SettingListLoading() {
  return (
    <main className="sl-loading" aria-hidden="true">
      {/* Stepper */}
      <div className="sl-loading-stepper" />

      {/* Filter row */}
      <div className="sl-loading-filters">
        <div className="sl-loading-filter" />
        <div className="sl-loading-filter" />
        <div className="sl-loading-filter" />
        <div className="sl-loading-filter" />
      </div>

      {/* Setting card grid */}
      <div className="sl-loading-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="sl-loading-card" key={i}>
            <div className="sl-loading-card-img" />
            <div className="sl-loading-card-body">
              <div className="sl-loading-card-line sl-loading-card-line--name" />
              <div className="sl-loading-card-line sl-loading-card-line--sku" />
              <div className="sl-loading-card-swatches">
                <div className="sl-loading-card-swatch" />
                <div className="sl-loading-card-swatch" />
                <div className="sl-loading-card-swatch" />
                <div className="sl-loading-card-swatch" />
              </div>
              <div className="sl-loading-card-line sl-loading-card-line--price" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
