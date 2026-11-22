import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../api/client';

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
    <main className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <form className="card shadow-sm p-4" style={{ width: '100%', maxWidth: 380 }} onSubmit={onSubmit} noValidate>
        <h1 className="h4 mb-1">Rosebud CRM</h1>
        <p className="text-muted small mb-4">PraSoft müşteri ilişkileri yönetimi</p>

        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

        <div className="mb-3">
          <label htmlFor="email" className="form-label">E-posta</label>
          <input id="email" type="email" className="form-control" autoComplete="username" autoFocus required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">Parola</label>
          <input id="password" type="password" className="form-control" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>

        {import.meta.env.DEV && (
          <p className="text-muted small mt-3 mb-0">
            Geliştirme hesapları: yonetim@ / satis1@ / teknik@rosebud.test · Parola123!
          </p>
        )}
      </form>
    </main>
  );
}
