'use client';

import { useRouter } from 'next/navigation';

interface Props {
  currentPage: number;
  totalPages: number;
  perPage: number;
  basePath: string; // e.g. /admin/products?q=x&category=engagement
}

export default function PaginationControls({ currentPage, totalPages, perPage, basePath }: Props) {
  const router = useRouter();

  function navigate(page: number, pp: number) {
    const url = new URL(basePath, 'http://x');
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(pp));
    router.push(url.pathname + url.search);
  }

  const pageOptions = Array.from({ length: totalPages }, (_, i) => i + 1);
  const perPageOptions = [10, 25, 50, 100];

  // Build page numbers with ellipsis
  const pages: (number | '…')[] = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - currentPage) <= 2) {
      pages.push(n);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="adm-pagination">
      {/* Prev */}
      <button
        className="adm-page-btn"
        onClick={() => navigate(currentPage - 1, perPage)}
        disabled={currentPage <= 1}
      >
        ← Prev
      </button>

      {/* Page number buttons */}
      <div className="adm-pagination__pages">
        {pages.map((n, i) =>
          n === '…' ? (
            <span key={`e-${i}`} className="adm-page-btn adm-page-btn--ellipsis">…</span>
          ) : (
            <button
              key={n}
              className={`adm-page-btn${n === currentPage ? ' adm-page-btn--active' : ''}`}
              onClick={() => navigate(n, perPage)}
              disabled={n === currentPage}
            >
              {n}
            </button>
          )
        )}
      </div>

      {/* Next */}
      <button
        className="adm-page-btn"
        onClick={() => navigate(currentPage + 1, perPage)}
        disabled={currentPage >= totalPages}
      >
        Next →
      </button>

      {/* Jump to page dropdown */}
      <div className="adm-pagination__jump">
        <label className="adm-pagination__label">Go to page</label>
        <select
          className="adm-pagination__select"
          value={currentPage}
          onChange={(e) => navigate(Number(e.target.value), perPage)}
        >
          {pageOptions.map(n => (
            <option key={n} value={n}>Page {n}</option>
          ))}
        </select>
      </div>

      {/* Per page dropdown */}
      <div className="adm-pagination__jump">
        <label className="adm-pagination__label">Show</label>
        <select
          className="adm-pagination__select"
          value={perPage}
          onChange={(e) => navigate(1, Number(e.target.value))}
        >
          {perPageOptions.map(n => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>
    </div>
  );
}
