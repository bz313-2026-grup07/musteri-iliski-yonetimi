import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { ROLES } from '../constants';
import CustomerForm from '../components/CustomerForm';
import Panel from '../components/Panel';

const TYPE_META = {
  interaction: { label: 'Görüşme', cls: 'text-bg-primary' },
  offer: { label: 'Teklif', cls: 'text-bg-success' },
  ticket: { label: 'Bilet', cls: 'text-bg-warning' },
};

const fmt = (d) => new Date(d).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

export default function CustomerDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/customers/${id}`), api.get(`/customers/${id}/timeline`)])
      .then(([c, t]) => { setCustomer(c.data.data); setTimeline(t.data.data); })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>;
  if (!customer) return <p className="text-muted">Yükleniyor…</p>;

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/musteriler">Müşteriler</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{customer.name}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <section className="col-lg-4" aria-labelledby="kart-baslik">
          <div className="panel panel-blue">
            <div className="panel-body">
              <div className="d-flex align-items-start">
                <h1 id="kart-baslik" className="h4 me-auto">{customer.name}</h1>
                {hasRole(ROLES.SALES) && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditing((e) => !e)}>
                    {editing ? 'Vazgeç' : 'Düzenle'}
                  </button>
                )}
              </div>
              {editing ? (
                <CustomerForm customer={customer} onSaved={(c) => { setCustomer({ ...customer, ...c }); setEditing(false); }} />
              ) : (
                <dl className="mb-0">
                  <Row label="Firma" value={customer.company} />
                  <Row label="Telefon" value={customer.phone} />
                  <Row label="E-posta" value={customer.email} />
                  <Row label="Şehir" value={customer.city} />
                  <Row label="Adres" value={customer.address} />
                  <Row label="Sorumlu" value={customer.owner_name} />
                  <Row label="Eski sistem no" value={customer.source_id} />
                  <Row label="Açıklama" value={customer.description} />
                </dl>
              )}
            </div>
          </div>
        </section>

        <div className="col-lg-8">
          <Panel title="İletişim geçmişi" icon="clock-history">
          {timeline.length === 0 && <p className="text-muted">Henüz kayıt yok.</p>}
          <ol className="list-group">
            {timeline.map((item) => (
              <li key={`${item.type}-${item.id}`} className="list-group-item">
                <div className="d-flex gap-2 align-items-center">
                  <span className={`badge ${TYPE_META[item.type].cls}`}>{TYPE_META[item.type].label}</span>
                  <strong className="me-auto">{item.title || item.subtype}</strong>
                  <small className="text-body-secondary">{fmt(item.at)}</small>
                </div>
                {item.body && <div className="small mt-1">{item.body}</div>}
                <div className="small text-body-secondary">{item.subtype}, {item.user_name}</div>
              </li>
            ))}
          </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <dt className="small text-muted">{label}</dt>
      <dd className="mb-0">{value}</dd>
    </div>
  );
}
