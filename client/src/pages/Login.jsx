import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../api/client';
import { APP_NAME, COMPANY_NAME } from '../config';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Giriş başarılı olunca user dolar ve kullanıcı geldiği sayfaya döner
  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-side">
        <div className="d-flex align-items-center gap-3">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span className="brand-name">{APP_NAME}</span>
        </div>
        <div>
          <h1>Müşteriler, çağrılar ve ticketlar tek yerde.</h1>
          <p>Bir müşterinin bütün geçmişini, bugünün çağrı yoğunluğunu ve açık talepleri aynı ekrandan takip edin.</p>
        </div>
        <small className="text-white-50">{COMPANY_NAME}</small>
      </aside>

      <main className="login-form-wrap">
        <form className="login-form" onSubmit={onSubmit} noValidate>
          <h2 className="h4 mb-1">Giriş yap</h2>
          <p className="text-body-secondary mb-4">Şirket e-posta adresinizle devam edin.</p>

          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

          <div className="mb-3">
            <label htmlFor="email" className="form-label">E-posta</label>
            <input id="email" type="email" className="form-control form-control-lg" autoComplete="username" autoFocus required
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">Parola</label>
            <input id="password" type="password" className="form-control form-control-lg" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={busy}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>

          {import.meta.env.DEV && (
            <p className="text-body-secondary small mt-4 mb-0">
              Geliştirme hesapları: yonetim@, satis1@ veya teknik@rosebud.test, parola Parola123!
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
