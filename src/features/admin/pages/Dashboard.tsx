import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {CircleDollarSign, PackageCheck, ShoppingBag, Users} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import type {Product} from '@/domain/product';
import {OPEN_STATUSES, RECOGNIZED_SALES_STATUSES, type OrderStatus} from '@/domain/orderStatus';
import {getYangonAnalyticsWindow} from '@/features/admin/lib/analyticsTime';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminStatCard from '@/features/admin/components/AdminStatCard';
import ActionRequiredPanel from '@/features/admin/components/ActionRequiredPanel';
import RecentOrdersPanel from '@/features/admin/components/RecentOrdersPanel';
import LowStockPanel from '@/features/admin/components/LowStockPanel';
import SalesOverviewPanel from '@/features/admin/components/SalesOverviewPanel';
import OrdersByStatusPanel from '@/features/admin/components/OrdersByStatusPanel';

const LOW_STOCK_THRESHOLD = 5;

function money(value: number) {
  return `K ${Math.round(value).toLocaleString('en-US')}`;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setProductsLoading(true);
    setOrdersLoading(true);
    setProductsError(null);
    setOrdersError(null);

    adminApi.listProducts()
      .then((result) => {
        if (alive) setProducts(result.products);
      })
      .catch((error: unknown) => {
        if (alive) setProductsError(error instanceof Error ? error.message : 'Products could not be loaded.');
      })
      .finally(() => {
        if (alive) setProductsLoading(false);
      });

    adminApi.listOrders()
      .then((result) => {
        if (alive) setOrders(result.orders);
      })
      .catch((error: unknown) => {
        if (alive) setOrdersError(error instanceof Error ? error.message : 'Orders could not be loaded.');
      })
      .finally(() => {
        if (alive) setOrdersLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const {currentStart, currentEnd} = getYangonAnalyticsWindow();
  const currentOrders = useMemo(() => orders.filter((order) => {
    const created = new Date(order.created_at);
    return created >= currentStart && created < currentEnd;
  }), [orders, currentStart, currentEnd]);

  const recognizedSales = useMemo(() => currentOrders
    .filter((order) => RECOGNIZED_SALES_STATUSES.includes(order.status as OrderStatus))
    .reduce((sum, order) => sum + (order.grand_total || 0), 0), [currentOrders]);

  const actionOrders = useMemo(() => orders.filter((order) => OPEN_STATUSES.includes(order.status as OrderStatus)), [orders]);
  const lowStock = useMemo(() => products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock), [products]);
  const uniqueCustomers = useMemo(() => new Set(orders.map((order) => order.phone_key).filter(Boolean)).size, [orders]);
  const recentOrders = useMemo(() => [...orders].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)), [orders]);

  const loading = productsLoading || ordersLoading;
  const retry = () => setReloadKey((key) => key + 1);

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Dashboard"
        description="See what needs attention and keep your store moving."
        actions={
          <span className="inline-flex min-h-10 items-center rounded-lg border border-[#E1E7E3] bg-white px-3 text-sm font-semibold text-[#1F2421]">
            Last 7 days
          </span>
        }
      />

      {(ordersError || productsError) ? (
        <AdminErrorState
          title="Some dashboard data could not be loaded"
          description={`${ordersError ? 'Orders, sales, pending orders, and customers are unavailable. ' : ''}${productsError ? 'Product and stock information is unavailable.' : ''}`}
          onRetry={retry}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store summary">
        {loading ? Array.from({length: 4}).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-[#E1E7E3] bg-white" />
        )) : (
          <>
            <AdminStatCard
              label="Sales"
              value={money(recognizedSales)}
              detail="Recognized sales · last 7 days"
              icon={CircleDollarSign}
            />
            <AdminStatCard
              label="Orders"
              value={String(currentOrders.length)}
              detail="Created in the last 7 days"
              icon={ShoppingBag}
            />
            <AdminStatCard
              label="Pending Orders"
              value={String(actionOrders.length)}
              detail="Need merchant attention now"
              icon={PackageCheck}
            />
            <AdminStatCard
              label="Customers"
              value={String(uniqueCustomers)}
              detail="Unique customer phone records"
              icon={Users}
            />
          </>
        )}
      </section>

      {!productsLoading && !productsError && products.length === 0 ? (
        <section className="rounded-xl border border-[#D8F1EA] bg-[#EEF9F6] p-5">
          <h2 className="font-bold text-[#1F2421]">Add your first product</h2>
          <p className="mt-1 text-sm text-[#66706C]">Your store needs at least one product before customers can place an order.</p>
          <Link
            to="/admin/products"
            className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[#1F2421] px-4 text-sm font-semibold text-white transition hover:bg-[#35B99D] hover:text-[#1F2421]">
            Go to Products
          </Link>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {!ordersError ? <ActionRequiredPanel orders={actionOrders} /> : null}
        {!productsError ? <LowStockPanel products={lowStock} /> : null}
      </div>

      {!ordersError ? <RecentOrdersPanel orders={recentOrders} /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {!ordersError ? (
          <SalesOverviewPanel
            orders={orders}
            currentStart={currentStart}
            currentEnd={currentEnd}
          />
        ) : null}
        {!ordersError ? (
          <OrdersByStatusPanel orders={orders} />
        ) : null}
      </div>
    </div>
  );
}
