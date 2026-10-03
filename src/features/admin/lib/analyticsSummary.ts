import type {AdminOrder} from '@/domain/order';
import {RECOGNIZED_SALES_STATUSES, type OrderStatus} from '@/domain/orderStatus';
import {
  buildCustomerSummaries,
  calculateCustomerMetrics,
  type CustomerMetrics,
} from '@/features/admin/lib/customerSummary';
import {
  getYangonRangeWindow,
  yangonDayKey,
  yangonStartOfDay,
} from '@/features/admin/lib/analyticsTime';

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'all';

export const ANALYTICS_STATUS_ORDER: OrderStatus[] = [
  'cod_pending',
  'pending_payment',
  'partial_checked',
  'checked',
  'shipped',
  'completed',
  'cancelled',
];

export interface AnalyticsStatusCount {
  status: OrderStatus;
  count: number;
}

export interface AnalyticsProductPerformance {
  name: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
}

export interface DailySalesPoint {
  key: string;
  label: string;
  amount: number;
  orderCount: number;
}

export interface AnalyticsSummary {
  timeRange: AnalyticsTimeRange;
  orderCount: number;
  recognizedOrderCount: number;
  recognizedSales: number;
  averageRecognizedOrderValue: number;
  statusDistribution: AnalyticsStatusCount[];
  dailySales: DailySalesPoint[];
  topProducts: AnalyticsProductPerformance[];
  customerMetrics: CustomerMetrics;
  isEmpty: boolean;
}

export function filterOrdersByTimeRange(
  orders: readonly AdminOrder[],
  timeRange: AnalyticsTimeRange,
  now = new Date(),
): AdminOrder[] {
  if (timeRange === 'all') {
    return [...orders];
  }

  const {start, end} = getYangonRangeWindow(timeRange, now);
  if (!start || !end) {
    return [...orders];
  }

  const startTime = start.getTime();
  const endTime = end.getTime();

  return orders.filter((order) => {
    if (!order.created_at) return true;
    const created = new Date(order.created_at).getTime();
    if (isNaN(created)) return true;
    return created >= startTime && created < endTime;
  });
}

export function deriveProductPerformance(orders: readonly AdminOrder[]): AnalyticsProductPerformance[] {
  const recognizedSet = new Set<string>(RECOGNIZED_SALES_STATUSES);
  const products = new Map<string, {name: string; unitsSold: number; revenue: number; orderIds: Set<string>}>();

  for (const order of orders) {
    if (!recognizedSet.has(order.status)) continue;
    if (!Array.isArray(order.items)) continue;

    for (const item of order.items) {
      const name = item.name?.trim() || 'Unnamed product';
      const qty = typeof item.qty === 'number' && item.qty > 0 ? item.qty : 1;
      const price = typeof item.price === 'number' ? item.price : 0;
      const revenue = price * qty;

      const existing = products.get(name);
      if (!existing) {
        products.set(name, {
          name,
          unitsSold: qty,
          revenue,
          orderIds: new Set([order.order_id]),
        });
      } else {
        existing.unitsSold += qty;
        existing.revenue += revenue;
        existing.orderIds.add(order.order_id);
      }
    }
  }

  return [...products.values()]
    .map((p) => ({
      name: p.name,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
      orderCount: p.orderIds.size,
    }))
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      return a.name.localeCompare(b.name);
    });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDailySalesPoints(
  orders: readonly AdminOrder[],
  timeRange: AnalyticsTimeRange,
  now = new Date(),
): DailySalesPoint[] {
  const recognizedSet = new Set<string>(RECOGNIZED_SALES_STATUSES);
  const {start, dayCount} = getYangonRangeWindow(timeRange, now);

  if (timeRange === 'all' || !start || dayCount === 0) {
    // For 'all', aggregate by actual days in the order set
    const dayMap = new Map<string, {key: string; label: string; amount: number; orderCount: number}>();
    for (const order of orders) {
      if (!recognizedSet.has(order.status)) continue;
      if (!order.created_at) continue;
      const orderDate = new Date(order.created_at);
      if (isNaN(orderDate.getTime())) continue;
      const key = yangonDayKey(orderDate);
      if (!dayMap.has(key)) {
        dayMap.set(key, {
          key,
          label: new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Yangon',
            month: 'short',
            day: 'numeric',
          }).format(orderDate),
          amount: order.grand_total || 0,
          orderCount: 1,
        });
      } else {
        const entry = dayMap.get(key)!;
        entry.amount += order.grand_total || 0;
        entry.orderCount += 1;
      }
    }
    return [...dayMap.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  // Fixed window of consecutive days
  const points: DailySalesPoint[] = [];
  const startMs = yangonStartOfDay(start).getTime();

  for (let i = 0; i < dayCount; i++) {
    const dayDate = new Date(startMs + i * DAY_MS);
    const key = yangonDayKey(dayDate);
    const label = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Yangon',
      weekday: dayCount <= 7 ? 'short' : undefined,
      month: 'short',
      day: 'numeric',
    }).format(dayDate);

    points.push({key, label, amount: 0, orderCount: 0});
  }

  const pointMap = new Map(points.map((p) => [p.key, p]));
  for (const order of orders) {
    if (!recognizedSet.has(order.status)) continue;
    if (!order.created_at) continue;
    const orderDate = new Date(order.created_at);
    if (isNaN(orderDate.getTime())) continue;
    const key = yangonDayKey(orderDate);
    const point = pointMap.get(key);
    if (point) {
      point.amount += order.grand_total || 0;
      point.orderCount += 1;
    }
  }

  return points;
}

export function buildAnalyticsSummary(
  allOrders: readonly AdminOrder[],
  timeRange: AnalyticsTimeRange = 'all',
  now = new Date(),
): AnalyticsSummary {
  const filteredOrders = filterOrdersByTimeRange(allOrders, timeRange, now);
  const statusCounts = new Map<OrderStatus, number>(
    ANALYTICS_STATUS_ORDER.map((status) => [status, 0]),
  );

  let recognizedOrderCount = 0;
  let recognizedSales = 0;

  for (const order of filteredOrders) {
    const status = order.status as OrderStatus;
    if (statusCounts.has(status)) {
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }

    if (RECOGNIZED_SALES_STATUSES.includes(status)) {
      recognizedOrderCount += 1;
      recognizedSales += order.grand_total || 0;
    }
  }

  const customerSummaries = buildCustomerSummaries(filteredOrders as AdminOrder[]);
  const customerMetrics = calculateCustomerMetrics(customerSummaries);
  const topProducts = deriveProductPerformance(filteredOrders);
  const dailySales = buildDailySalesPoints(filteredOrders, timeRange, now);

  return {
    timeRange,
    orderCount: filteredOrders.length,
    recognizedOrderCount,
    recognizedSales,
    averageRecognizedOrderValue:
      recognizedOrderCount > 0 ? Math.round(recognizedSales / recognizedOrderCount) : 0,
    statusDistribution: ANALYTICS_STATUS_ORDER.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    dailySales,
    topProducts,
    customerMetrics,
    isEmpty: allOrders.length === 0,
  };
}
