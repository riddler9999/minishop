// ---- COMPOSITION ROOT --------------------------------------------------------
import {lazy, Suspense, useEffect} from 'react';
import {Route, Routes, useLocation} from 'react-router-dom';
import {AdminAuthProvider} from '@/features/auth/adminAuth';
import Landing from '@/features/landing/pages/Landing';
import {RouteScopedCartProvider} from '@/features/cart/state';
import RequireAdmin from '@/app/routes/RequireAdmin';

const AdminLogin = lazy(() => import('@/features/auth/pages/Login'));
const Onboarding = lazy(() => import('@/features/auth/pages/Onboarding'));
const Subscribe = lazy(() => import('@/features/billing/pages/Subscribe'));
const Billing = lazy(() => import('@/features/billing/pages/Billing'));
const Dashboard = lazy(() => import('@/features/admin/pages/Dashboard'));
const Analytics = lazy(() => import('@/features/admin/pages/Analytics'));
const Customers = lazy(() => import('@/features/admin/pages/Customers'));
const SuperAdminDashboard = lazy(() => import('@/features/superadmin/pages/SuperAdminDashboard'));
const AdminProducts = lazy(() => import('@/features/catalog/pages/AdminProducts'));
const AdminOrders = lazy(() => import('@/features/orders/pages/AdminOrders'));
const AdminShipping = lazy(() => import('@/features/shipping/pages/AdminShipping'));
const Settings = lazy(() => import('@/features/shop/pages/Settings'));
const SettingsUsers = lazy(() => import('@/features/shop/pages/SettingsUsers'));
const SettingsPayments = lazy(() => import('@/features/shop/pages/SettingsPayments'));
const SettingsCheckout = lazy(() => import('@/features/shop/pages/SettingsCheckout'));
const SettingsNotifications = lazy(() => import('@/features/shop/pages/SettingsNotifications'));
const SettingsPrivacy = lazy(() => import('@/features/shop/pages/SettingsPrivacy'));
const StoreDesign = lazy(() => import('@/features/shop/pages/StoreDesign'));
const LifecycleStoreBuilder = lazy(() => import('@/features/shop/pages/LifecycleStoreBuilder'));
const Themes = lazy(() => import('@/features/shop/pages/Themes'));
const StoreNavigation = lazy(() => import('@/features/shop/pages/StoreNavigation'));
const StoreDomains = lazy(() => import('@/features/shop/pages/StoreDomains'));
const StorePolicies = lazy(() => import('@/features/shop/pages/StorePolicies'));
const FashionDemo = lazy(() => import('@/features/fashion-demo/pages/FashionDemo'));
const FurnitureDemo = lazy(() => import('@/features/furniture-demo/pages/FurnitureDemo'));
const MobileDemo = lazy(() => import('@/features/mobile-demo/pages/MobileDemo'));
const AdminConsole = lazy(() => import('@/app/routes/AdminConsole'));
const ShopRoute = lazy(() => import('@/app/routes/ShopRoute'));
const RootStorefront = lazy(() => import('@/app/routes/ShopRoute').then((module) => ({default: module.RootStorefront})));

// Product fonts are deferred until a product route is visited. The landing uses
// system fonts and must not wait on an external font stylesheet.
export default function App() {
  const {pathname} = useLocation();
  useEffect(() => {
    if (pathname === '/' || document.getElementById('minishop-product-fonts')) return;
    const stylesheet = document.createElement('link');
    stylesheet.id = 'minishop-product-fonts';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'https://fonts.googleapis.com/css2?family=Calistoga&family=Inter:wght@400;500;600;700&family=Cormorant:wght@500;600;700&family=Montserrat:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap';
    document.head.appendChild(stylesheet);
  }, [pathname]);
  return (
    <AdminAuthProvider>
      <RouteScopedCartProvider>
        <Suspense fallback={<div className="grid min-h-screen place-items-center bg-white text-sm text-slate-700" role="status">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo/*" element={<RootStorefront />} />
          <Route path="/fashion-demo/*" element={<FashionDemo />} />
          <Route path="/furniture-demo/*" element={<FurnitureDemo />} />
          <Route path="/mobile-store-demo/*" element={<MobileDemo />} />
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
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="billing" element={<Billing />} />
            <Route path="design" element={<StoreDesign />} />
            <Route path="online-store/themes" element={<Themes />} />
            <Route path="online-store/themes/customize" element={<LifecycleStoreBuilder />} />
            <Route path="store/navigation" element={<StoreNavigation />} />
            <Route path="store/domains" element={<StoreDomains />} />
            <Route path="store/policies" element={<StorePolicies />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/billing" element={<Billing />} />
            <Route path="settings/users" element={<SettingsUsers />} />
            <Route path="settings/payments" element={<SettingsPayments />} />
            <Route path="settings/checkout" element={<SettingsCheckout />} />
            <Route path="settings/shipping" element={<AdminShipping />} />
            <Route path="settings/domains" element={<StoreDomains />} />
            <Route path="settings/policies" element={<StorePolicies />} />
            <Route path="settings/notifications" element={<SettingsNotifications />} />
            <Route path="settings/privacy" element={<SettingsPrivacy />} />
          </Route>
          <Route path="/s/:slug/*" element={<ShopRoute />} />
          <Route path="*" element={<RootStorefront />} />
        </Routes>
        </Suspense>
      </RouteScopedCartProvider>
    </AdminAuthProvider>
  );
}
