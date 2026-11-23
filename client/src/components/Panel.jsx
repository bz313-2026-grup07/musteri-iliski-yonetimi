/**
 * Beyaz kart. Üst kenar rengi içeriğin türünü anlatır:
 *   green = gelen çağrı / genel olumlu, blue = giden çağrı / kişiler, amber = ticket,
 *   teal = teklif, red = uyarı. Renk vermezseniz gri kalır.
 *   <Panel title="Bugün arayan müşteriler" icon="headset" color="green" actions={<button…/>} flush>…</Panel>
 * flush: tablo gibi kenara yaslanan içerikte iç boşluğu kaldırır.
 */
export default function Panel({ title, icon, color, actions, flush = false, children }) {
  return (
    <section className={`panel${color ? ` panel-${color}` : ''}`} aria-label={typeof title === 'string' ? title : undefined}>
      {title && (
        <header className="panel-header">
          <h2 className="panel-title">
            {icon && <i className={`bi bi-${icon} me-2`} aria-hidden="true" />}
            {title}
          </h2>
          {actions && <div className="ms-auto d-flex gap-2">{actions}</div>}
        </header>
      )}
      <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
    </section>
  );
}
