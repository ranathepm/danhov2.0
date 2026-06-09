export default function AdminLoading() {
  return (
    <div className="adm-page">
      <div className="adm-skeleton">
        <div className="adm-skeleton-line adm-skeleton-line--title" />
        <div className="adm-skeleton-line adm-skeleton-line--sub" />
        <div className="adm-skeleton-block" style={{ height: 56 }} />
        <div className="adm-skeleton-block" style={{ height: 240 }} />
      </div>
    </div>
  );
}
