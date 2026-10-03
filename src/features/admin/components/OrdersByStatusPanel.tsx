import {useMemo} from 'react';
import type {AdminOrder} from '@/domain/order';
import {statusMeta} from '@/domain/orderStatus';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminSurface from '@/features/admin/components/AdminSurface';
import {buildAnalyticsSummary} from '@/features/admin/lib/analyticsSummary';

interface OrdersByStatusPanelProps {
  orders: readonly AdminOrder[];
}

export default function OrdersByStatusPanel({orders}: OrdersByStatusPanelProps) {
  const summary = useMemo(() => buildAnalyticsSummary(orders), [orders]);

  const largestCount = useMemo(() => {
    return Math.max(1, ...summary.statusDistribution.map((item) => item.count));
  }, [summary]);

  return (
    <AdminSurface>
      <div>
        <h2 className="text-lg font-bold text-[#1F2421]">Orders by Status</h2>
        <p className="mt-0.5 text-xs text-[#66706C]">
          Distribution across all canonical order lifecycle states.
        </p>
      </div>

      {summary.isEmpty ? (
        <div className="mt-4">
          <AdminEmptyState
            title="No orders yet"
            description="Orders will appear here once customers complete checkout."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {summary.statusDistribution.map(({status, count}) => {
            const width = count === 0 ? 0 : Math.max(6, (count / largestCount) * 100);
            const meta = statusMeta(status);

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1F2421]">{meta.admin}</span>
                  <span className="font-semibold tabular-nums text-[#1F2421]">
                    {count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F4F7F5]" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-[#35B99D] transition-all duration-300"
                    style={{width: `${width}%`}}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminSurface>
  );
}
