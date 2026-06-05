export default function DiamondLoading() {
  return (
    <main className="be-loading">
      <div className="be-loading-head">
        <div className="be-loading-eyebrow" />
        <div className="be-loading-title" />
        <div className="be-loading-sub" />
      </div>

      <div className="be-loading-layout">
        <aside className="be-loading-sidebar" aria-hidden="true">
          <div className="be-loading-facet" />
          <div className="be-loading-facet" />
          <div className="be-loading-facet" />
          <div className="be-loading-facet" />
        </aside>

        <section className="be-loading-results" aria-hidden="true">
          <div className="be-loading-toolbar" />
          <div className="be-loading-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div className="be-loading-card" key={i}>
                <div className="be-loading-card-media" />
                <div className="be-loading-card-line be-loading-card-line--name" />
                <div className="be-loading-card-line be-loading-card-line--meta" />
                <div className="be-loading-card-line be-loading-card-line--price" />
                <div className="be-loading-card-cta" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
