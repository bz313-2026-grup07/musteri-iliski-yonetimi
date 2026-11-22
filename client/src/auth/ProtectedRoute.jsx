import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Oturum yoksa girişe yollar. roles verilirse rol kontrolü de yapar.
 * NOT: Bu yalnızca arayüz kolaylığıdır; asıl yetki kontrolü backend'dedir.
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-5 text-center text-muted">Yükleniyor…</div>;
  if (!user) return <Navigate to="/giris" replace state={{ from: location }} />;
  if (roles && !hasRole(...roles)) {
    return <div className="alert alert-warning m-4" role="alert">Bu sayfayı görüntüleme yetkiniz yok.</div>;
  }
  return <Outlet />;
}
