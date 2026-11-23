import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Bu kontrol sadece arayüz içindir; asıl yetki kontrolü API tarafında yapılıyor.
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
