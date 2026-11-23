/**
 * Müşteri listesi - REFERANS SAYFA
 * Ticket / teklif listeleri bu yapıyla yazılabilir: PageHeader + Panel(arama) + tablo + sayfalama.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import Pagination from '../components/Pagination';
import CustomerForm from '../components/CustomerForm';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';

const PAGE_SIZE = 25;

export default function Customers({ initialQuery = '' }) {
  const { hasRole } = useAuth();
  const [q, setQ] = useState(initialQuery);
  const [debouncedQ, setDebouncedQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Yazmayı bitirdikten 300 ms sonra ara
  useEffect(() => {
    if (q === debouncedQ) return undefined;
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q, debouncedQ]);

  useEffect(() => {
    let cancelled = false;
    api.get('/customers', { params: { q: debouncedQ || undefined, page, pageSize: PAGE_SIZE } })
      .then((res) => { if (!cancelled) { setResult(res.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ, page, reloadKey]);

  const total = result.meta.total;

  return (
    <>
      <PageHeader title="Müşteriler" subtitle={loading ? 'Yükleniyor…' : `${total.toLocaleString('tr-TR')} kayıt`}>
        {hasRole('satis') && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((s) => !s)} aria-expanded={showForm}>
            <i className={`bi bi-${showForm ? 'x-lg' : 'plus-lg'} me-1`} aria-hidden="true" />
            {showForm ? 'Formu kapat' : 'Yeni müşteri'}
          </button>
        )}
      </PageHeader>

      {showForm && (
        <Panel title="Yeni müşteri" icon="person-plus" color="blue">
          <CustomerForm onSaved={() => { setShowForm(false); setReloadKey((k) => k + 1); }} />
        </Panel>
      )}

      <Panel
        title="Müşteri listesi"
        icon="person-vcard"
        flush
        actions={(
          <div role="search">
            <label htmlFor="customer-search" className="visually-hidden">Listede ara</label>
            <input id="customer-search" type="search" className="form-control form-control-sm" style={{ minWidth: 260 }}
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, firma, e-posta, telefon, eski no…" />
          </div>
        )}
      >
        {error && <div className="alert alert-danger m-3" role="alert">{error}</div>}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <caption className="visually-hidden">Müşteri listesi, {total} kayıt</caption>
            <thead>
              <tr>
                <th scope="col">Ad / unvan</th>
                <th scope="col">Telefon</th>
                <th scope="col">E-posta</th>
                <th scope="col">Şehir</th>
                <th scope="col">Sorumlu</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/musteriler/${c.id}`} className="fw-medium">{c.name}</Link>
                    {c.company && <div className="small text-body-secondary">{c.company}</div>}
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td>{c.city}</td>
                  <td>{c.owner_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && result.data.length === 0 && (
          <div className="empty">
            {debouncedQ ? `"${debouncedQ}" ile eşleşen müşteri yok. Aramayı kısaltmayı deneyin.` : 'Henüz müşteri yok.'}
          </div>
        )}

        <div className="px-3 py-2 border-top">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </Panel>
    </>
  );
}
