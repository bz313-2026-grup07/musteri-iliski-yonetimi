/** Sayfa başlığı: solda başlık (+ isteğe bağlı alt satır), sağda butonlar/filtreler */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="me-auto">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
