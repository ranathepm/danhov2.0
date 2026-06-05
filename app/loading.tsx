export default function GlobalLoading() {
  return (
    <div className="route-loader" aria-hidden="true">
      <div className="route-loader-bar" />
      <div className="route-loader-stage" role="status" aria-label="Loading">
        <svg className="route-loader-ring" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="28" cy="28" r="24" stroke="#AC3438" strokeWidth="1.8" />
          <circle cx="28" cy="28" r="17" stroke="#AC3438" strokeWidth="1" opacity="0.45" />
          <circle cx="28" cy="28" r="4" fill="#AC3438" opacity="0.5" />
          <circle cx="28" cy="4" r="2.5" fill="#AC3438" opacity="0.9" />
        </svg>
        <span className="route-loader-text">DANHOV</span>
      </div>
    </div>
  );
}
