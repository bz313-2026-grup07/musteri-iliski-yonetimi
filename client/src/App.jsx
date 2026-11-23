import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Placeholder from './pages/Placeholder';
import { ROLES } from './constants';

// Üst bardaki arama aynı sayfadayken de yeni sorguyla açılsın diye key olarak query string kullanılıyor.
function CustomersRoute() {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get('q') || '';
  return <Customers key={search} initialQuery={q} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="musteriler" element={<CustomersRoute />} />
              <Route path="musteriler/:id" element={<CustomerDetail />} />

              <Route path="biletler" element={<Placeholder note="KT2 kapsamında geliştiriliyor." />} />
              <Route path="teklifler" element={<Placeholder note="KT3 kapsamında geliştiriliyor." />} />

              <Route path="bildirimler" element={<Placeholder />} />
              <Route path="myd" element={<Placeholder />} />
              <Route path="anketler" element={<Placeholder />} />
              <Route path="sirket-ici-ticket" element={<Placeholder />} />
              <Route path="hosting" element={<Placeholder />} />
              <Route path="faturalar" element={<Placeholder />} />

              <Route element={<ProtectedRoute roles={[ROLES.SUPPORT]} />}>
                <Route path="aktarim" element={<Placeholder note="KT3 kapsamında geliştiriliyor." />} />
              </Route>
              <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
                <Route path="kullanicilar" element={<Placeholder note="KT2 kapsamında geliştiriliyor." />} />
              </Route>

              <Route path="*" element={<Placeholder />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
