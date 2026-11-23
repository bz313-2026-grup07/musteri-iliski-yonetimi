import { useState } from 'react';
import api, { errorMessage } from '../api/client';

const EMPTY = { name: '', company: '', phone: '', email: '', city: '', address: '', description: '' };

const FIELDS = [
  ['name', 'Ad / Unvan *', 'text', 'col-md-6'],
  ['company', 'Firma', 'text', 'col-md-6'],
  ['phone', 'Telefon', 'tel', 'col-md-4'],
  ['email', 'E-posta', 'email', 'col-md-4'],
  ['city', 'Şehir', 'text', 'col-md-4'],
];

export default function CustomerForm({ customer, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...pick(customer) }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = customer
        ? await api.patch(`/customers/${customer.id}`, form)
        : await api.post('/customers', form);
      onSaved?.(res.data.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
      <div className="row g-3">
        {FIELDS.map(([key, label, type, col]) => (
          <div className={col} key={key}>
            <label htmlFor={`cf-${key}`} className="form-label">{label}</label>
            <input id={`cf-${key}`} type={type} className="form-control" value={form[key]} onChange={set(key)}
              required={key === 'name'} />
          </div>
        ))}
        <div className="col-12">
          <label htmlFor="cf-address" className="form-label">Adres</label>
          <textarea id="cf-address" className="form-control" rows={2} value={form.address} onChange={set('address')} />
        </div>
        <div className="col-12">
          <label htmlFor="cf-description" className="form-label">Açıklama</label>
          <textarea id="cf-description" className="form-control" rows={2} value={form.description} onChange={set('description')} />
        </div>
      </div>
      <button type="submit" className="btn btn-success mt-3" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
    </form>
  );
}

function pick(c) {
  if (!c) return {};
  return Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? '']));
}
