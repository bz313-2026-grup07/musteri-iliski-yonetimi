import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const ROLE_LABEL = { yonetim: 'Yönetim', satis: 'Satış', teknik: 'Teknik' };

// Menü: yeni sayfa eklenince buraya bir satır ekleyin
const NAV = [
  { to: '/', label: 'Gösterge Paneli', end: true },
  { to: '/musteriler', label: 'Müşteriler' },
  { to: '/biletler', label: 'Destek Biletleri' },
  { to: '/teklifler', label: 'Teklifler' },
  { to: '/aktarim', label: 'Veri Aktarımı', roles: ['teknik'] },
  { to: '/kullanicilar', label: 'Kullanıcılar', roles: [] }, // yalnızca yonetim
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <>
      <a href="#main" className="visually-hidden-focusable btn btn-light position-absolute m-2">İçeriğe geç</a>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark" aria-label="Ana menü">
        <div className="container-fluid">
          <NavLink className="navbar-brand fw-semibold" to="/">Rosebud CRM</NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav"
            aria-controls="nav" aria-expanded="false" aria-label="Menüyü aç/kapat">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto">
              {NAV.filter((n) => !n.roles || hasRole(...n.roles)).map((n) => (
                <li className="nav-item" key={n.to}>
                  <NavLink className="nav-link" to={n.to} end={n.end}>{n.label}</NavLink>
                </li>
              ))}
            </ul>
            <span className="navbar-text text-light me-3 small">
              {user.fullName} · <span className="badge text-bg-secondary">{ROLE_LABEL[user.role]}</span>
            </span>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={logout}>Çıkış</button>
          </div>
        </div>
      </nav>
      <main id="main" className="container-fluid py-4" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
