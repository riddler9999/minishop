import {useEffect, useState} from 'react';
import {Navigate, Route, Routes, useLocation, useParams} from 'react-router-dom';
import {setShopSlug} from './lib/shopContext';
import {isValidSlug} from './lib/slug';
import {isSupabaseConfigured} from './lib/supabase';
import {resolveShop, isShopCached} from './lib/backend';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderLookup from './pages/OrderLookup';
import NotFound from './pages/NotFound';
import {AdminAuthProvider, useAdminAuth} from './lib/adminAuth';
import {getOwnShop} from './lib/sellerShop';
import {PlanProvider} from './lib/plan';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/Login';
import Onboarding from './pages/admin/Onboarding';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminShipping from './pages/admin/AdminShipping';
import Settings from './pages/admin/Settings';

// Route guard for the admin console: requires a real Supabase session AND an
// onboarded shop (a `shops` row owned by that session's user). A session
// without a shop yet is sent to /admin/onboarding rather than the dashboard.
function RequireAdmin({children}: {children: React.ReactNode}) {
  const {loading: authLoading, session, user} = useAdminAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    let alive = true;
    setChecking(true);
    getOwnShop(user.id)
      .then((shop) => alive && setHasShop(Boolean(shop)))
      .catch(() => alive && setHasShop(false))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [user]);

  if (authLoading || (session && checking)) {
    return <div className="grid min-h-screen place-items-center bg-ink text-sm text-cream-200">Loading…</div>;
  }
  if (!session) {
    return <Navigate to="/admin/login" replace state={{from: location.pathname}} />;
  }
  if (!hasShop) {
    return <Navigate to="/admin/onboarding" replace />;
  }
  return <>{children}</>;
}

// Admin console shell — wraps the layout in PlanProvider so every admin page can
// read the seller's plan + shop via usePlan(). RequireAdmin has already proven a
// session AND an owned shop exist by the time this renders, so `user` is set.
function AdminConsole() {
  const {user} = useAdminAuth();
  if (!user) return null;
  return (
    <PlanProvider userId={user.id}>
      <AdminLayout />
    </PlanProvider>
  );
}

// Storefront branch — keeps the customer-facing chrome (header/footer/cart).
// Mounted at both the root (`/*`, demo shop, no slug) and `/s/:slug/*` (a real
// tenant). Child paths are RELATIVE so they resolve under whichever base mounted
// them — absolute paths would throw "Absolute route path nested under…" under
// `/s/:slug/*` (react-router v7).
function Storefront() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:orderId" element={<OrderSuccess />} />
        <Route path="orders" element={<OrderLookup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

// The active shop slug is set during RENDER (not in an effect) at each
// storefront entry: `ShopRoute` sets the URL's slug, `RootStorefront` clears it.
// Two reasons this is render-phase, not effect-based:
//  1. Descendant pages' first data-fetch effects must see the slug already set
//     (effects fire child→parent, so a parent effect would run too late).
//  2. setShopSlug is idempotent (same value every render), so StrictMode's
//     double-render is harmless. We deliberately do NOT reset via an effect
//     cleanup: StrictMode double-invokes effect setup/cleanup on mount, which
//     would clear the slug back to null right after mounting a valid shop. The
//     symmetric "each entry sets its own value in render" approach avoids that —
//     leaving one storefront branch for another always re-runs the new branch's
//     render, which sets the correct value.

function ShopChecking() {
  return (
    <Layout>
      <div className="grid min-h-[50vh] place-items-center text-sm text-ink-soft">ဆိုင် ရှာဖွေနေသည်…</div>
    </Layout>
  );
}

function ShopUnavailable() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream-50 px-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">ဆိုင်စနစ် ခေတ္တအသုံးပြု၍မရပါ</h1>
        <p className="my mt-2 text-sm text-ink-soft">ခဏအကြာ ပြန်စမ်းပါ။ ဆိုင်ရှင်ထံ ဆက်သွယ်နိုင်ပါသည်။</p>
      </div>
    </div>
  );
}

// Multi-tenant storefront entry: `/s/:slug/*`. The slug (the WebView-safe source
// of truth — survives reloads, unlike storage) scopes the Supabase-backed data
// layer (src/lib/store.ts) to this shop.
//
// Beyond Milestone A's format check, this confirms the shop actually EXISTS
// (active row in the DB) before mounting the storefront, so a well-formed slug
// for a missing/inactive shop shows a 404 instead of every page erroring on its
// first query. The lookup runs ONLY when it can matter — `isLiveBackend()`
// (Supabase configured AND slug set); with Supabase unconfigured it's always
// 'ok' with zero lookup, and the root demo never enters this component at all.
function ShopRoute() {
  const {slug} = useParams<{slug: string}>();
  const valid = isValidSlug(slug);

  setShopSlug(valid ? slug : null);

  const [shopState, setShopState] = useState<'checking' | 'ok' | 'missing'>(() =>
    valid && isSupabaseConfigured && !isShopCached(slug!) ? 'checking' : 'ok',
  );

  useEffect(() => {
    // No lookup needed: bad format, demo/unconfigured, or already-cached shop —
    // skipping the 'checking' flip on a cache hit avoids a needless Storefront
    // remount/flicker when a buyer revisits a shop this session.
    if (!valid || !isSupabaseConfigured) return;
    if (isShopCached(slug!)) {
      setShopState('ok');
      return;
    }
    let alive = true;
    setShopState('checking');
    resolveShop()
      .then(() => alive && setShopState('ok'))
      .catch(() => alive && setShopState('missing'));
    return () => {
      alive = false;
    };
  }, [slug, valid]);

  // Bad slug format → bare 404 (no shop chrome — not even confirmed shop-shaped).
  if (!valid) return <NotFound />;
  if (!isSupabaseConfigured) return <ShopUnavailable />;
  if (shopState === 'checking') return <ShopChecking />;
  // Confirmed-missing shop → 404 with app chrome (Layout fetches nothing per-shop).
  if (shopState === 'missing') {
    return (
      <Layout>
        <NotFound />
      </Layout>
    );
  }
  return <Storefront />;
}

// Root (slug-less) storefront: the demo shop. Clears any slug a previous
// in-app navigation may have set, so root pages never resolve against a stale
// shop's live backend.
function RootStorefront() {
  setShopSlug(null);
  return <Storefront />;
}

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
