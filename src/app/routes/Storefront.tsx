// ---- SHELL: buyer storefront -------------------------------------------------
import {useEffect, useState} from 'react';
import {Link, Route, Routes} from 'react-router-dom';
import Layout from '@/shared/ui/Layout';
import NotFound from '@/shared/ui/NotFound';
import Home from '@/features/catalog/pages/Home';
import ProductDetail from '@/features/catalog/pages/ProductDetail';
import Products from '@/features/catalog/pages/Products';
import Checkout from '@/features/checkout/pages/Checkout';
import OrderSuccess from '@/features/checkout/pages/OrderSuccess';
import OrderLookup from '@/features/orders/pages/OrderLookup';
import PolicyPage from '@/shared/ui/PolicyPage';
import DemoCart from '@/features/cart/pages/DemoCart';
import {DemoStoreProvider} from '@/features/demo/DemoStoreContext';
import {useAdminAuth} from '@/features/auth/adminAuth';
import {getOwnShop} from '@/features/shop/sellerShop';
import {getCachedShopInfo} from '@/features/tenancy/shopResolver';

// Storefront branch — keeps the customer-facing chrome (header/footer/cart).
// Mounted at both the root (`/*`, demo shop, no slug) and `/s/:slug/*` (a real
// tenant). Child paths are RELATIVE so they resolve under whichever base mounted
// them — absolute paths would throw "Absolute route path nested under…" under
// `/s/:slug/*` (react-router v7).
export default function Storefront() {
  const {user} = useAdminAuth();
  const shop = getCachedShopInfo();
  const [ownership, setOwnership] = useState<'checking' | 'own' | 'other'>(() => user && shop ? 'checking' : 'other');

  useEffect(() => {
    let alive = true;
    if (!user || !shop) {
      setOwnership('other');
      return () => { alive = false; };
    }
    setOwnership('checking');
    getOwnShop(user.id)
      .then((own) => {
        if (alive) setOwnership(own?.slug === shop.slug ? 'own' : 'other');
      })
      .catch(() => {
        if (alive) setOwnership('other');
      });
    return () => { alive = false; };
  }, [user, shop?.slug]);

  const drawerFooterAction = ownership === 'own' ? (
    <Link to="/admin" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#e11d48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#be123c]">
      Dashboard
    </Link>
  ) : ownership === 'checking' ? (
    <div className="h-12 w-full animate-pulse rounded-full bg-rose-100" aria-label="Checking seller access" />
  ) : undefined;

  return (
    <DemoStoreProvider>
    <Layout drawerFooterAction={drawerFooterAction}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<DemoCart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:orderId" element={<OrderSuccess />} />
        <Route path="orders" element={<OrderLookup />} />
        <Route path="shipping-policy" element={<PolicyPage title="ပို့ဆောင်သည့်ပုံစံ" />} />
        <Route path="refund-policy" element={<PolicyPage title="Refund Policy" />} />
        <Route path="privacy-policy" element={<PolicyPage title="Privacy Policy" />} />
        <Route path="terms-of-service" element={<PolicyPage title="Terms of Service" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
    </DemoStoreProvider>
  );
}
