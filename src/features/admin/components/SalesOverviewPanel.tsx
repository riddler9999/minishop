import {useMemo} from 'react';
import type {AdminOrder} from '@/domain/order';
import {RECOGNIZED_SALES_STATUSES, type OrderStatus} from '@/domain/orderStatus';
import AdminEmptyState from '@/features/admin/components/AdminEmptyState';
import AdminSurface from '@/features/admin/components/AdminSurface';
import {yangonDayKey, yangonStartOfDay} from '@/features/admin/lib/analyticsTime';

function money(value: number) {
  return `K ${Math.round(value).toLocaleString('en-US')}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface SalesOverviewPanelProps {
  orders: readonly AdminOrder[];
  currentStart: Date;
  currentEnd: Date;
}

interface DailySales {
  key: string;
  label: string;
  amount: number;
  orderCount: number;
}

export default function SalesOverviewPanel({
  orders,
  currentStart,
  currentEnd,
}: SalesOverviewPanelProps) {
  const dailyData = useMemo<DailySales[]>(() => {
    // Generate the 7 consecutive days in the window
    const days: DailySales[] = [];
    const startTime = yangonStartOfDay(currentStart).getTime();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startTime + i * DAY_MS);
      const key = yangonDayKey(dayDate);
      const label = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Yangon',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(dayDate);

      days.push({
        key,
        label,
        amount: 0,
        orderCount: 0,
      });
    }

    const dayMap = new Map(days.map((d) => [d.key, d]));

    for (const order of orders) {
      const created = new Date(order.created_at);
      if (created >= currentStart && created < currentEnd) {
        if (RECOGNIZED_SALES_STATUSES.includes(order.status as OrderStatus)) {
          const key = yangonDayKey(created);
          const entry = dayMap.get(key);
          if (entry) {
            entry.amount += order.grand_total || 0;
            entry.orderCount += 1;
          }
        }
      }
    }

    return days;
  }, [orders, currentStart, currentEnd]);

  const totalRecognizedSales = useMemo(() => {
    return dailyData.reduce((sum, d) => sum + d.amount, 0);
  }, [dailyData]);

  const totalRecognizedOrders = useMemo(() => {
    return dailyData.reduce((sum, d) => sum + d.orderCount, 0);
  }, [dailyData]);

  const maxDailyAmount = useMemo(() => {
    return Math.max(1, ...dailyData.map((d) => d.amount));
  }, [dailyData]);

  const hasSales = totalRecognizedSales > 0 || totalRecognizedOrders > 0;

  return (
    <AdminSurface>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1F2421]">Sales Overview</h2>
          <p className="mt-0.5 text-xs text-[#66706C]">
            Daily recognized sales from checked, shipped, and completed orders.
          </p>
        </div>
        {hasSales ? (
          <div className="mt-2 text-left sm:mt-0 sm:text-right">
            <span className="text-base font-bold tabular-nums text-[#1F2421]">
              {money(totalRecognizedSales)}
            </span>
            <span className="ml-2 text-xs text-[#66706C]">
              ({totalRecognizedOrders} order{totalRecognizedOrders === 1 ? '' : 's'})
            </span>
          </div>
        ) : null}
      </div>

      {!hasSales ? (
        <div className="mt-4">
          <AdminEmptyState
            title="No recognized sales in this period"
            description="Sales are recorded when orders are checked, shipped, or completed."
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {dailyData.map((day) => {
            const width = day.amount === 0 ? 0 : Math.max(6, (day.amount / maxDailyAmount) * 100);
            return (
              <div key={day.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1F2421]">{day.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#66706C]">
                      {day.orderCount} order{day.orderCount === 1 ? '' : 's'}
                    </span>
                    <span className="font-semibold tabular-nums text-[#1F2421]">
                      {money(day.amount)}
                    </span>
                  </div>
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
