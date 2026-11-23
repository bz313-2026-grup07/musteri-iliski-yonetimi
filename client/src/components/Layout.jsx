/**
 * Ana yerleşim: gruplu koyu sol menü + üst bar (müşteri arama, bildirim, kullanıcı).
 * Menü içeriği src/config.js > MENU dizisinden gelir.
 */
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { APP_NAME, COMPANY_NAME, MENU } from '../config';

const ROLE_LABEL = { yonetim: 'Yönetim', satis: 'Satış', teknik: 'Teknik' };

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false); // masaüstü: dar menü
  const [mobileOpen, setMobileOpen] = useState(false); // mobil: açılır menü
  const [search, setSearch] = useState('');

  const groups = MENU
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || hasRole(...i.roles)) }))
    .filter((g) => g.items.length > 0);

  function toggleMenu() {
    if (window.matchMedia('(max-width: 991.98px)').matches) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  function onSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/musteriler?q=${encodeURIComponent(q)}` : '/musteriler');
    setSearch('');
  }

  const initials = user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className={`app${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-menu-open' : ''}`}>
      <a href="#main" className="visually-hidden-focusable skip-link">İçeriğe geç</a>

      <aside className="sidebar" aria-label="Ana menü">
        <NavLink to="/" className="brand" aria-label={`${APP_NAME} ana sayfa`}>
          <span className="brand-mark" aria-hidden="true">P</span>
          <span className="brand-name">{APP_NAME}</span>
        </NavLink>

        {/* Mobilde bir bağlantıya tıklanınca menü kapansın */}
        <nav className="menu" onClick={(e) => { if (e.target.closest('a')) setMobileOpen(false); }}>
          {groups.map((g) => (
            <div className="menu-group" key={g.group}>
              <h2 className="menu-group-title">{g.group}</h2>
              <ul>
                {g.items.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className="menu-link" title={item.label}>
                      <i className={`bi bi-${item.icon} tone-${item.tone}`} aria-hidden="true" />
                      <span className="menu-label">{item.label}</span>
                      {item.soon && <span className="menu-soon">yakında</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">{COMPANY_NAME}</div>
      </aside>

      {mobileOpen && <div className="backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn" onClick={toggleMenu} aria-label="Menüyü aç veya kapat">
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <form className="topbar-search" role="search" onSubmit={onSearch}>
            <i className="bi bi-search" aria-hidden="true" />
            <label htmlFor="global-search" className="visually-hidden">Müşteri ara</label>
            <input id="global-search" type="search" placeholder="Müşteri ara: ad, firma, telefon…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>

          <div className="topbar-end">
            <NavLink to="/bildirimler" className="icon-btn" title="Bildirimler">
              <i className="bi bi-bell" aria-hidden="true" />
              <span className="visually-hidden">Bildirimler</span>
            </NavLink>

            <div className="dropdown">
              <button type="button" className="user-btn" data-bs-toggle="dropdown" aria-expanded="false">
                <span className="avatar" aria-hidden="true">{initials}</span>
                <span className="user-meta">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-role">{ROLE_LABEL[user.role]}</span>
                </span>
                <i className="bi bi-chevron-down small" aria-hidden="true" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><span className="dropdown-item-text small text-body-secondary">{user.email}</span></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button type="button" className="dropdown-item" onClick={logout}>
                    <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Çıkış yap
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
