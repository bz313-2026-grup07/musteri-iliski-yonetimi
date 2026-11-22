/**
 * Müşteri listesi - REFERANS SAYFA
 * Bilet / teklif listeleri bu yapıyla yazılabilir: arama + tablo + sayfalama + yeni kayıt formu.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import Pagination from '../components/Pagination';
import CustomerForm from '../components/CustomerForm';

const PAGE_SIZE = 25;

export default function Customers() {
  const { hasRole } = useAuth();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], meta: { total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Yazmayı bitirdikten 300 ms sonra ara
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/customers', { params: { q: debouncedQ || undefined, page, pageSize: PAGE_SIZE } })
      .then((res) => { if (!cancelled) { setResult(res.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQ, page, reloadKey]);

  return (
    <>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0 me-auto">Müşteriler</h1>
        {hasRole('satis') && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((s) => !s)} aria-expanded={showForm}>
            {showForm ? 'Formu kapat' : '+ Yeni müşteri'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-body mb-3">
          <CustomerForm onSaved={() => { setShowForm(false); setReloadKey((k) => k + 1); }} />
        </div>
      )}

      <div className="mb-3" role="search">
        <label htmlFor="customer-search" className="visually-hidden">Müşteri ara</label>
        <input id="customer-search" type="search" className="form-control" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Ad, firma, e-posta, telefon veya eski sistem no ile ara…" />
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <caption className="small">
            {loading ? 'Yükleniyor…' : `${result.meta.total.toLocaleString('tr-TR')} kayıt`}
          </caption>
          <thead className="table-light">
            <tr>
              <th scope="col">Ad / Unvan</th>
              <th scope="col">Firma</th>
              <th scope="col">Telefon</th>
              <th scope="col">E-posta</th>
              <th scope="col">Şehir</th>
              <th scope="col">Sorumlu</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((c) => (
              <tr key={c.id}>
                <td><Link to={`/musteriler/${c.id}`}>{c.name}</Link></td>
                <td>{c.company}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.city}</td>
                <td>{c.owner_name}</td>
              </tr>
            ))}
            {!loading && result.data.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted py-4">Kayıt bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={result.meta.total} onChange={setPage} />
    </>
  );
}
