import {useEffect, useMemo, useState} from 'react';
import {BarChart3, CircleDollarSign, ReceiptText} from 'lucide-react';
import {adminApi} from '@/data/dataSource';
import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import AdminPageHeader from '@/features/admin/components/AdminPageHeader';
import AdminErrorState from '@/features/admin/components/AdminErrorState';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminStatCard from '@/features/admin/components/AdminStatCard';
import {buildAnalyticsSummary} from '@/features/admin/lib/analyticsSummary';

function money(value: number) {
  return `K ${Math.round(value).toLocaleString('en-US')}`;
}

export default function Analytics() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
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

  const summary = useMemo(() => buildAnalyticsSummary(orders), [orders]);
  const largestStatusCount = Math.max(1, ...summary.statusDistribution.map((item) => item.count));

  return (
    <div className="space-y-5 pb-24 lg:pb-8">
      <AdminPageHeader
        title="Analytics"
        description="Descriptive order performance based on your existing MiniShop order records."
      />

      {error ? (
        <AdminErrorState
          title="Could not load analytics"
          description="Order analytics are unavailable right now. No zero-value fallback is shown because that could be misleading."
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : null}

      {loading ? (
        <section aria-label="Loading analytics" className="grid gap-3 sm:grid-cols-3">
          {Array.from({length: 3}).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </section>
      ) : null}

      {!loading && !error && summary.isEmpty ? (
        <AdminEmptyState
          title="No analytics yet"
          description="Analytics will appear after your store receives orders."
        />
      ) : null}

      {!loading && !error && !summary.isEmpty ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Analytics summary">
            <AdminStatCard
              label="Recognized Sales"
              value={money(summary.recognizedSales)}
              detail="Full value from checked, shipped, and completed orders"
              icon={CircleDollarSign}
            />
            <AdminStatCard
              label="Orders"
              value={String(summary.orderCount)}
              detail="Orders available in the authoritative admin order dataset"
              icon={ReceiptText}
            />
            <AdminStatCard
              label="Avg. Recognized Order"
              value={money(summary.averageRecognizedOrderValue)}
              detail={`${summary.recognizedOrderCount} recognized orders`}
              icon={BarChart3}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5">
              <h2 className="text-base font-bold text-slate-950">Orders by Status</h2>
              <p className="mt-1 text-sm text-slate-600">
                Counts from the same order records used by the seller admin. Bars show relative count only.
              </p>
            </div>

            <div className="space-y-4">
              {summary.statusDistribution.map(({status, count}) => {
                const width = count === 0 ? 0 : Math.max(4, (count / largestStatusCount) * 100);
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-slate-700">{statusMeta(status).admin}</span>
                      <span className="tabular-nums font-semibold text-slate-950">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{width: `${width}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
