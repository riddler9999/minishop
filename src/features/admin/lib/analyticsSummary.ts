import type {AdminOrder} from '@/domain/order';
import {RECOGNIZED_SALES_STATUSES, type OrderStatus} from '@/domain/orderStatus';

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

export interface AnalyticsSummary {
  orderCount: number;
  recognizedOrderCount: number;
  recognizedSales: number;
  averageRecognizedOrderValue: number;
  statusDistribution: AnalyticsStatusCount[];
  isEmpty: boolean;
}

export function buildAnalyticsSummary(orders: readonly AdminOrder[]): AnalyticsSummary {
  const statusCounts = new Map<OrderStatus, number>(
    ANALYTICS_STATUS_ORDER.map((status) => [status, 0]),
  );

  let recognizedOrderCount = 0;
  let recognizedSales = 0;

  for (const order of orders) {
    const status = order.status as OrderStatus;
    if (statusCounts.has(status)) {
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    }

    if (RECOGNIZED_SALES_STATUSES.includes(status)) {
      recognizedOrderCount += 1;
      recognizedSales += order.grand_total || 0;
    }
  }

  return {
    orderCount: orders.length,
    recognizedOrderCount,
    recognizedSales,
    averageRecognizedOrderValue: recognizedOrderCount > 0 ? recognizedSales / recognizedOrderCount : 0,
    statusDistribution: ANALYTICS_STATUS_ORDER.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    isEmpty: orders.length === 0,
  };
}
