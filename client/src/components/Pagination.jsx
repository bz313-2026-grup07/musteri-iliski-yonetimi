export default function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  return (
    <nav aria-label="Sayfalar" className="d-flex align-items-center gap-2">
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ‹ Önceki
      </button>
      <span className="small" aria-live="polite">Sayfa {page} / {pages}</span>
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Sonraki ›
      </button>
    </nav>
  );
}
