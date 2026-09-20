// ---- SHELL: buyer storefront -------------------------------------------------
import {Route, Routes} from 'react-router-dom';
import Layout from '@/shared/ui/Layout';
import NotFound from '@/shared/ui/NotFound';
import Home from '@/features/catalog/pages/Home';
import ProductDetail from '@/features/catalog/pages/ProductDetail';
import Products from '@/features/catalog/pages/Products';
import Checkout from '@/features/checkout/pages/Checkout';
import OrderSuccess from '@/features/checkout/pages/OrderSuccess';
import OrderLookup from '@/features/orders/pages/OrderLookup';
import PolicyPage from '@/shared/ui/PolicyPage';

// Storefront branch — keeps the customer-facing chrome (header/footer/cart).
// Mounted at both the root (`/*`, demo shop, no slug) and `/s/:slug/*` (a real
// tenant). Child paths are RELATIVE so they resolve under whichever base mounted
// them — absolute paths would throw "Absolute route path nested under…" under
// `/s/:slug/*` (react-router v7).
export default function Storefront() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:orderId" element={<OrderSuccess />} />
        <Route path="orders" element={<OrderLookup />} />
        <Route path="shipping-policy" element={<PolicyPage title="ပို့ဆောင်သည့်ပုံစံ" />} />
        <Route path="refund-policy" element={<PolicyPage title="Refund Policy" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
