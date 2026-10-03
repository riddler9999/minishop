import {useEffect, useMemo, useState} from 'react';
import {
  BarChart3,
  Calendar,
  CircleDollarSign,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminStatCard from '@/features/admin/components/AdminStatCard';
import AdminSurface from '@/features/admin/components/AdminSurface';
import AdminLoadingState from '@/features/admin/components/AdminLoadingState';
import {
  buildAnalyticsSummary,
  type AnalyticsTimeRange,
} from '@/features/admin/lib/analyticsSummary';
import {cx} from '@/shared/lib/format';

function money(value: number) {
  return `K ${Math.round(value).toLocaleString('en-US')}`;
}

const TIME_RANGES: {id: AnalyticsTimeRange; label: string}[] = [
  {id: 'today', label: 'Today'},
  {id: '7d', label: 'Last 7 days'},
  {id: '30d', label: 'Last 30 days'},
  {id: 'all', label: 'All time'},
];

export default function Analytics() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    adminApi.listOrders()
      .then((result) => {
        if (!alive) return;
        setOrders(result.orders);
      })
      .catch((nextError: unknown) => {
        if (!alive) return;
        setError(nextError instanceof Error ? nextError.message : 'Analytics could not be loaded.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const summary = useMemo(() => buildAnalyticsSummary(orders, timeRange), [orders, timeRange]);
  const largestStatusCount = Math.max(1, ...summary.statusDistribution.map((item) => item.count));
  const maxDailySales = Math.max(1, ...summary.dailySales.map((item) => item.amount));

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        title="Analytics"
        description="Authoritative commerce analytics derived from your store order records."
        actions={
          !loading && !error && !summary.isEmpty ? (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1 shadow-xs">
              <Calendar className="ml-2 h-4 w-4 text-[var(--admin-muted)]" aria-hidden="true" />
              {TIME_RANGES.map((range) => {
                const active = timeRange === range.id;
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setTimeRange(range.id)}
                    className={cx(
                      'min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus)]',
                      active
                        ? 'bg-[#1F2421] text-white shadow-xs'
                        : 'text-[var(--admin-muted)] hover:bg-[var(--admin-canvas)] hover:text-[var(--admin-text)]',
                    )}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          ) : undefined
        }
      />

      {error ? (
        <AdminErrorState
          title="Could not load analytics"
          description="Order analytics are unavailable right now. No zero-value fallback is shown because that could be misleading."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : null}

      {loading ? (
        <AdminLoadingState message="Loading analytics..." />
      ) : null}

      {!loading && !error && summary.isEmpty ? (
        <AdminEmptyState
          title="No analytics yet"
          description="Analytics will appear after your store receives orders."
        />
      ) : null}

      {!loading && !error && !summary.isEmpty ? (
        <>
          {/* KPI Summary Cards */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Analytics summary">
            <AdminStatCard
              label="Recognized Sales"
              value={money(summary.recognizedSales)}
              detail="From checked, shipped, and completed orders"
              icon={CircleDollarSign}
            />
            <AdminStatCard
              label="Orders"
              value={String(summary.orderCount)}
              detail={`${summary.recognizedOrderCount} recognized orders in period`}
              icon={ReceiptText}
            />
            <AdminStatCard
              label="Avg. Order Value"
              value={money(summary.averageRecognizedOrderValue)}
              detail="Per recognized order"
              icon={BarChart3}
            />
            <AdminStatCard
              label="Customers"
              value={String(summary.customerMetrics.totalCustomers)}
              detail={`${summary.customerMetrics.repeatCustomers} repeat customers`}
              icon={Users}
            />
          </section>

          {/* Sales Overview & Orders By Status */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Overview */}
            <AdminSurface>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--admin-text)]">Sales Overview</h2>
                  <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                    Daily recognized sales in selected time period.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums text-[var(--admin-text)]">
                    {money(summary.recognizedSales)}
                  </span>
                </div>
              </div>

              {summary.dailySales.length === 0 || summary.recognizedSales === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--admin-muted)]">
                  No recognized sales in this time period.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.dailySales.map((day) => {
                    const width =
                      day.amount === 0 ? 0 : Math.max(4, (day.amount / maxDailySales) * 100);
                    return (
                      <div key={day.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[var(--admin-text)]">{day.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--admin-muted)]">
                              {day.orderCount} order{day.orderCount === 1 ? '' : 's'}
                            </span>
                            <span className="font-semibold tabular-nums text-[var(--admin-text)]">
                              {money(day.amount)}
                            </span>
                          </div>
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-[var(--admin-canvas)]"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-[var(--admin-primary)] transition-all duration-300"
                            style={{width: `${width}%`}}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AdminSurface>

            {/* Orders by Status */}
            <AdminSurface>
              <div className="mb-4">
                <h2 className="text-base font-bold text-[var(--admin-text)]">Orders by Status</h2>
                <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                  Counts across all canonical order lifecycle states.
                </p>
              </div>

              <div className="space-y-3">
                {summary.statusDistribution.map(({status, count}) => {
                  const width =
                    count === 0 ? 0 : Math.max(4, (count / largestStatusCount) * 100);
                  const meta = statusMeta(status);

                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--admin-text)]">{meta.admin}</span>
                        <span className="font-semibold tabular-nums text-[var(--admin-text)]">
                          {count}
                        </span>
                      </div>
                      <div
                        className="h-2 w-full overflow-hidden rounded-full bg-[var(--admin-canvas)]"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-[var(--admin-primary)] transition-all duration-300"
                          style={{width: `${width}%`}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AdminSurface>
          </div>

          {/* Product Performance & Customer Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Products */}
            <AdminSurface>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--admin-text)]">Top Products</h2>
                  <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                    Best-performing products by recognized sales in this period.
                  </p>
                </div>
                <Package className="h-5 w-5 text-[var(--admin-muted)]" aria-hidden="true" />
              </div>

              {summary.topProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--admin-muted)]">
                  No product sales recorded in recognized orders for this period.
                </div>
              ) : (
                <div className="divide-y divide-[#E1E7E3] overflow-hidden rounded-xl border border-[var(--admin-border)]">
                  {summary.topProducts.slice(0, 5).map((product, idx) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between bg-[var(--admin-surface)] p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-canvas)] text-[10px] font-bold text-[var(--admin-muted)]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--admin-text)]">{product.name}</p>
                          <p className="text-[11px] text-[var(--admin-muted)]">
                            {product.unitsSold} unit{product.unitsSold === 1 ? '' : 's'} across {product.orderCount} order{product.orderCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-[var(--admin-text)]">
                        {money(product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </AdminSurface>

            {/* Customer Insights */}
            <AdminSurface>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--admin-text)]">Customer Insights</h2>
                  <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                    Customer behavior derived from authoritative order records.
                  </p>
                </div>
                <Users className="h-5 w-5 text-[var(--admin-muted)]" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-3.5">
                  <p className="text-[11px] font-medium text-[var(--admin-muted)]">Total Buyers</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[var(--admin-text)]">
                    {summary.customerMetrics.totalCustomers}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-3.5">
                  <p className="text-[11px] font-medium text-[var(--admin-muted)]">Repeat Buyers</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-[var(--admin-text)]">
                    {summary.customerMetrics.repeatCustomers}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-canvas)] p-3.5 sm:col-span-1">
                  <p className="text-[11px] font-medium text-[var(--admin-muted)]">Avg. Customer Spend</p>
                  <p className="mt-1 text-base font-bold tabular-nums text-[var(--admin-text)]">
                    {money(summary.customerMetrics.averageRecognizedSpendPerCustomer)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#D8F1EA] bg-[var(--admin-primary-soft)]/30 p-3 text-xs text-[var(--admin-text)]">
                <div className="flex items-center gap-2 font-semibold">
                  <ShoppingBag className="h-4 w-4 text-[var(--admin-primary-hover)]" />
                  <span>Buyer Relationship Health</span>
                </div>
                <p className="mt-1 text-[var(--admin-muted)]">
                  {summary.customerMetrics.totalCustomers > 0
                    ? `${Math.round(
                        (summary.customerMetrics.repeatCustomers /
                          summary.customerMetrics.totalCustomers) *
                          100,
                      )}% of customers have placed more than one order.`
                    : 'Customer repeat rates will appear once orders are placed.'}
                </p>
              </div>
            </AdminSurface>
          </div>
        </>
      ) : null}
    </div>
  );
}
