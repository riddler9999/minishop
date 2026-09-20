// ---- COMPOSITION ROOT --------------------------------------------------------
// The only module that knows the full route table. Each branch's shell, guard
// and tenant-resolution logic lives beside it in ./routes; feature pages are
// referenced here and nowhere else, so adding a page never edits a feature.

import {Route, Routes} from 'react-router-dom';
import {AdminAuthProvider} from '@/features/auth/adminAuth';
import AdminLogin from '@/features/auth/pages/Login';
import Onboarding from '@/features/auth/pages/Onboarding';
import Dashboard from '@/features/admin/pages/Dashboard';
import AdminProducts from '@/features/catalog/pages/AdminProducts';
import AdminOrders from '@/features/orders/pages/AdminOrders';
import AdminShipping from '@/features/shipping/pages/AdminShipping';
import Settings from '@/features/shop/pages/Settings';
import AdminConsole from './routes/AdminConsole';
import RequireAdmin from './routes/RequireAdmin';
import ShopRoute, {RootStorefront} from './routes/ShopRoute';

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        {/* Admin console — its own chrome, no storefront header/footer. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/onboarding" element={<Onboarding />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminConsole />
            </RequireAdmin>
          }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Multi-tenant storefront: /s/:slug/... (slug scopes the data layer). */}
        <Route path="/s/:slug/*" element={<ShopRoute />} />

        {/* Everything else is the root/demo storefront (clears the shop slug). */}
        <Route path="*" element={<RootStorefront />} />
      </Routes>
    </AdminAuthProvider>
  );
}
