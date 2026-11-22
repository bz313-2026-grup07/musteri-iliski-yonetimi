import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Placeholder title="Gösterge Paneli" sprint="KT3 (günlük analiz)" />} />
              <Route path="musteriler" element={<Customers />} />
              <Route path="musteriler/:id" element={<CustomerDetail />} />
              <Route path="biletler" element={<Placeholder title="Destek Biletleri" sprint="KT2" />} />
              <Route path="teklifler" element={<Placeholder title="Teklifler" sprint="KT3" />} />

              <Route element={<ProtectedRoute roles={['teknik']} />}>
                <Route path="aktarim" element={<Placeholder title="Veri Aktarımı" sprint="KT3" />} />
              </Route>
              <Route element={<ProtectedRoute roles={[]} />}>
                <Route path="kullanicilar" element={<Placeholder title="Kullanıcılar" sprint="KT2" />} />
              </Route>

              <Route path="*" element={<Placeholder title="Sayfa bulunamadı" sprint="—" />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
