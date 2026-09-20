import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {AlertTriangle, ArrowRight, BarChart3, Box, Package, ShoppingBag} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import type {Product} from '@/domain/product';
import {ks} from '@/shared/lib/format';
import {usePlan} from '@/features/billing/plan';
import {UpgradeCard} from '@/features/billing/PlanGate';
import {statusMeta, PAID_STATUSES, OPEN_STATUSES, type OrderStatus} from '@/domain/orderStatus';
import {addYangonDays, getYangonAnalyticsWindow, YANGON_TZ} from '@/features/admin/lib/analyticsTime';

const LOW_STOCK_THRESHOLD = 5;

interface StatCard {
  key: string;
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{className?: string}>;
  tone: string;
}

interface RevenuePoint {
  date: Date;
  total: number;
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {timeZone: YANGON_TZ, day: '2-digit', month: 'short'}).format(date);
}

function orderTime(date: string): string {
  return new Intl.DateTimeFormat('en-US', {timeZone: YANGON_TZ, hour: 'numeric', minute: '2-digit'}).format(new Date(date));
}

function formatMoney(n: number): string {
  return `K ${Math.round(n).toLocaleString('en-US')}`;
}

function PeriodBadge() {
  return <span className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">Last 7 days</span>;
}

function RevenueTrend({points}: {points: RevenuePoint[]}) {
  const width = 680;
  const height = 210;
  const padX = 22;
  const padTop = 20;
  const padBottom = 36;
  const chartHeight = height - padTop - padBottom;
  const max = Math.max(...points.map((p) => p.total), 1);
  const coords = points.map((p, index) => ({
    x: padX + (index * (width - padX * 2)) / Math.max(points.length - 1, 1),
    y: padTop + chartHeight - (p.total / max) * chartHeight,
  }));
  const line = coords.map((p) => `${p.x},${p.y}`).join(' ');
  const area = coords.length
    ? `M ${coords[0].x} ${padTop + chartHeight} L ${coords.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${coords.at(-1)?.x ?? 0} ${padTop + chartHeight} Z`
    : '';

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-slate-950">Revenue Trend</h2>
        <span className="flex h-10 items-center rounded-2xl bg-slate-50 px-3 text-xs font-semibold text-slate-700">Last 7 days</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Last 7 days revenue trend">
        <defs>
          <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff2f79" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#ff2f79" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => {
          const y = padTop + chartHeight * ratio;
          return <line key={ratio} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e8edf5" strokeWidth="1" />;
        })}
        {area && <path d={area} fill="url(#revenueFill)" />}
        {coords.length > 0 && <polyline fill="none" points={line} stroke="#ff2f79" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
        {coords.map((p, index) => <circle key={points[index].date.toISOString()} cx={p.x} cy={p.y} r="5" fill="#ff2f79" />)}
        {points.map((p, index) => (
          <text key={p.date.toISOString()} x={coords[index]?.x ?? 0} y={height - 8} textAnchor="middle" fontSize="12" fill="#7c8596">
            {shortDate(p.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const {shop, features} = usePlan();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([adminApi.listProducts(), adminApi.listOrders()])
      .then(([productResult, orderResult]) => {
        if (!alive) return;
        setProducts(productResult.products);
        setOrders(orderResult.orders);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const {currentStart, currentEnd, previousStart, previousEnd} = getYangonAnalyticsWindow();
  const currentOrders = useMemo(
    () => orders.filter((order) => {
      const created = new Date(order.created_at);
      return created >= currentStart && created < currentEnd;
    }),
    [orders, currentStart, currentEnd],
  );

  const currentRevenue = useMemo(
    () => currentOrders.filter((order) => PAID_STATUSES.includes(order.status as OrderStatus)).reduce((sum, order) => sum + (order.grand_total || 0), 0),
    [currentOrders],
  );

  const previousRevenue = useMemo(
    () => orders
      .filter((order) => {
        const created = new Date(order.created_at);
        return created >= previousStart && created < previousEnd;
      })
      .filter((order) => PAID_STATUSES.includes(order.status as OrderStatus))
      .reduce((sum, order) => sum + (order.grand_total || 0), 0),
    [orders, previousStart, previousEnd],
  );

  const revenueDelta = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null;
  const activeProducts = products.filter((product) => product.status === 'active');
  const lowStock = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);
  const actionOrders = orders.filter((order) => OPEN_STATUSES.includes(order.status as OrderStatus));

  const stats = useMemo<StatCard[]>(() => [
    {key: 'revenue', label: 'Total Revenue', value: formatMoney(currentRevenue), sub: revenueDelta == null ? 'Last 7 days' : `${revenueDelta >= 0 ? '+' : ''}${Math.round(revenueDelta)}% vs previous 7 days`, icon: BarChart3, tone: 'bg-pink-50 text-pink-500'},
    {key: 'orders', label: 'Orders', value: String(currentOrders.length), sub: actionOrders.length > 0 ? `${actionOrders.length} need your action` : 'All caught up', icon: ShoppingBag, tone: 'bg-cyan-50 text-cyan-500'},
    {key: 'products', label: 'Products', value: String(activeProducts.length), sub: 'Active products', icon: Box, tone: 'bg-violet-50 text-violet-500'},
    {key: 'stock', label: 'Low Stock', value: String(lowStock.length), sub: 'Products', icon: AlertTriangle, tone: 'bg-orange-50 text-orange-500'},
  ], [actionOrders.length, activeProducts.length, currentOrders.length, currentRevenue, lowStock.length, revenueDelta]);

  const revenuePoints = useMemo<RevenuePoint[]>(() => Array.from({length: 7}, (_, index) => {
    const date = addYangonDays(currentStart, index);
    const next = addYangonDays(date, 1);
    const total = orders
      .filter((order) => {
        const created = new Date(order.created_at);
        return created >= date && created < next && PAID_STATUSES.includes(order.status as OrderStatus);
      })
      .reduce((sum, order) => sum + (order.grand_total || 0), 0);
    return {date, total};
  }), [currentStart, orders]);

  const recentOrders = orders.slice(0, 3);
  const lowStockPreview = lowStock.slice(0, 2);

  return (
    <div className="space-y-4 pb-24 sm:space-y-5 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[30px] font-black tracking-tight text-slate-950 sm:text-4xl">Sale Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Your shop performance at a glance</p>
        </div>
        <PeriodBadge />
      </header>

      <section className="grid grid-cols-2 gap-3">
        {loading ? Array.from({length: 4}).map((_, index) => (
          <div key={index} className="h-[132px] animate-pulse rounded-[26px] border border-slate-200 bg-white" />
        )) : stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ${stat.tone}`}><Icon className="h-6 w-6" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">{stat.label}</p>
                  <p className="mt-1 truncate text-[22px] font-black tracking-tight text-slate-950 sm:text-[28px]">{stat.value}</p>
                  <p className={`mt-1 text-[11px] leading-4 sm:text-xs ${stat.key === 'revenue' && revenueDelta != null && revenueDelta >= 0 ? 'font-semibold text-emerald-500' : 'text-slate-500'}`}>{stat.sub}</p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {!loading && <RevenueTrend points={revenuePoints} />}

      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-slate-950">New Orders</h2>
            <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-500">{actionOrders.length}</span>
          </div>
          <Link to="/admin/orders" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-slate-700 hover:text-pink-500">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? (
          <div className="space-y-2 px-4 pb-4">{Array.from({length: 3}).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-50" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">No orders yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
            {recentOrders.map((order) => {
              const firstItem = order.items[0];
              const status = statusMeta(order.status);
              return (
                <li key={order.order_id}>
                  <Link to="/admin/orders" className="flex min-h-[76px] items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-slate-50">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Package className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">#{order.order_id}</p>
                      <p className="truncate text-xs text-slate-500">{order.customer_name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{orderTime(order.created_at)}{firstItem ? ` · ${firstItem.name}` : ''}</p>
                    </div>
                    <span className={`hidden rounded-full px-3 py-1 text-[11px] font-semibold sm:inline-flex ${status.cls}`}>{status.admin}</span>
                    <span className="shrink-0 text-sm font-black text-slate-950">{formatMoney(order.grand_total)}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {features.advancedDashboard ? (
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-5">
            <h2 className="text-[17px] font-bold text-slate-950">Low Stock Products</h2>
            <Link to="/admin/products" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-slate-700 hover:text-pink-500">View all <ArrowRight className="h-4 w-4" /></Link>
          </div>
          {loading ? (
            <div className="space-y-2 px-4 pb-4">{Array.from({length: 2}).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-50" />)}</div>
          ) : lowStockPreview.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">Stock levels look healthy.</div>
          ) : (
            <ul className="divide-y divide-slate-100 px-3 pb-2 sm:px-4">
              {lowStockPreview.map((product) => (
                <li key={product.id}>
                  <Link to="/admin/products" className="flex min-h-[76px] items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-slate-50">
                    {product.image ? <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-2xl border border-slate-100 object-cover" loading="lazy" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400"><Package className="h-5 w-5" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 inline-flex rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-500">{product.stock <= 0 ? 'Out of stock' : `Only ${product.stock} left`}</p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-slate-950">{ks(product.promoPrice ?? product.price).replace(' Ks', '').replace(/^/, 'K ')}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <UpgradeCard title="Stock analytics">Low-stock analytics is available with the Business package.</UpgradeCard>
      )}

      <p className="sr-only">{shop?.name ?? 'Shop'} dashboard</p>
    </div>
  );
}
