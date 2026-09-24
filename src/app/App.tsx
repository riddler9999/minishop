// ---- COMPOSITION ROOT --------------------------------------------------------
import {Route, Routes} from 'react-router-dom';
import {AdminAuthProvider} from '@/features/auth/adminAuth';
import AdminLogin from '@/features/auth/pages/Login';
import Onboarding from '@/features/auth/pages/Onboarding';
import Subscribe from '@/features/billing/pages/Subscribe';
import Billing from '@/features/billing/pages/Billing';
import Dashboard from '@/features/admin/pages/Dashboard';
import SuperAdminDashboard from '@/features/superadmin/pages/SuperAdminDashboard';
import AdminProducts from '@/features/catalog/pages/AdminProducts';
import AdminOrders from '@/features/orders/pages/AdminOrders';
import AdminShipping from '@/features/shipping/pages/AdminShipping';
import Settings from '@/features/shop/pages/Settings';
import StoreDesign from '@/features/shop/pages/StoreDesign';
import Landing from '@/features/landing/pages/Landing';
import FashionDemo from '@/features/fashion-demo/pages/FashionDemo';
import FurnitureDemo from '@/features/furniture-demo/pages/FurnitureDemo';
import AdminConsole from './routes/AdminConsole';
import RequireAdmin from './routes/RequireAdmin';
import ShopRoute, {RootStorefront} from './routes/ShopRoute';

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo/*" element={<RootStorefront />} />
        <Route path="/fashion-demo/*" element={<FashionDemo />} />
        <Route path="/furniture-demo/*" element={<FurnitureDemo />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/admin/subscribe" element={<Subscribe />} />
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
          <Route path="billing" element={<Billing />} />
          <Route path="design" element={<StoreDesign />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/s/:slug/*" element={<ShopRoute />} />
        <Route path="*" element={<RootStorefront />} />
      </Routes>
    </AdminAuthProvider>
  );
}
