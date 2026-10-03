import type {AdminOrder} from '@/domain/order';
import {RECOGNIZED_SALES_STATUSES} from '@/domain/orderStatus';

export interface CustomerSummary {
  key: string;
  name: string;
  phone: string;
  latestAddress?: string;
  orderCount: number;
  recognizedOrderCount: number;
  totalSpend: number;
  lastOrderId: string;
  lastOrderAt: string;
  firstOrderAt: string;
  orders: AdminOrder[];
}

export type CustomerSortOption = 'recent' | 'spend' | 'orders' | 'name';

export interface CustomerMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  totalRecognizedSpend: number;
  averageRecognizedSpendPerCustomer: number;
}

const recognizedStatuses = new Set<string>(RECOGNIZED_SALES_STATUSES);

export function identityKey(order: AdminOrder): string {
  const phoneKey = order.phone_key?.trim();
  if (phoneKey) return `phone:${phoneKey}`;
  return `order:${order.order_id}`;
}

export function buildCustomerSummaries(orders: AdminOrder[]): CustomerSummary[] {
  const groups = new Map<string, {
    key: string;
    name: string;
    phone: string;
    latestAddress?: string;
    orderCount: number;
    recognizedOrderCount: number;
    totalSpend: number;
    lastOrderId: string;
    lastOrderAt: string;
    firstOrderAt: string;
    orders: AdminOrder[];
  }>();

  for (const order of orders) {
    const key = identityKey(order);
    const isRecognized = recognizedStatuses.has(order.status);
    const recognizedAmount = isRecognized ? (order.grand_total || 0) : 0;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        name: order.customer_name?.trim() || 'Unknown customer',
        phone: order.customer_phone?.trim() || '',
        latestAddress: order.customer_address?.trim() || undefined,
        orderCount: 1,
        recognizedOrderCount: isRecognized ? 1 : 0,
        totalSpend: recognizedAmount,
        lastOrderId: order.order_id,
        lastOrderAt: order.created_at,
        firstOrderAt: order.created_at,
        orders: [order],
      });
      continue;
    }

    existing.orderCount += 1;
    existing.totalSpend += recognizedAmount;
    if (isRecognized) {
      existing.recognizedOrderCount += 1;
    }
    existing.orders.push(order);

    const orderTime = new Date(order.created_at).getTime();
    const lastOrderTime = new Date(existing.lastOrderAt).getTime();
    const firstOrderTime = new Date(existing.firstOrderAt).getTime();

    if (orderTime > lastOrderTime) {
      if (order.customer_name?.trim()) existing.name = order.customer_name.trim();
      if (order.customer_phone?.trim()) existing.phone = order.customer_phone.trim();
      if (order.customer_address?.trim()) existing.latestAddress = order.customer_address.trim();
      existing.lastOrderId = order.order_id;
      existing.lastOrderAt = order.created_at;
    }

    if (orderTime < firstOrderTime) {
      existing.firstOrderAt = order.created_at;
    }
  }

  // Sort orders inside each customer by created_at desc
  for (const summary of groups.values()) {
    summary.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return [...groups.values()].sort((a, b) => {
    const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
    if (timeDelta !== 0) return timeDelta;
    return a.key.localeCompare(b.key);
  });
}

export function sortCustomerSummaries(
  summaries: CustomerSummary[],
  sortBy: CustomerSortOption,
): CustomerSummary[] {
  return [...summaries].sort((a, b) => {
    if (sortBy === 'spend') {
      const spendDiff = b.totalSpend - a.totalSpend;
      if (spendDiff !== 0) return spendDiff;
      const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      if (timeDelta !== 0) return timeDelta;
      return a.key.localeCompare(b.key);
    }

    if (sortBy === 'orders') {
      const countDiff = b.orderCount - a.orderCount;
      if (countDiff !== 0) return countDiff;
      const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      if (timeDelta !== 0) return timeDelta;
      return a.key.localeCompare(b.key);
    }

    if (sortBy === 'name') {
      const nameDiff = a.name.localeCompare(b.name);
      if (nameDiff !== 0) return nameDiff;
      const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      if (timeDelta !== 0) return timeDelta;
      return a.key.localeCompare(b.key);
    }

    // Default: 'recent'
    const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
    if (timeDelta !== 0) return timeDelta;
    return a.key.localeCompare(b.key);
  });
}

export function filterCustomerSummaries(
  summaries: CustomerSummary[],
  query: string,
): CustomerSummary[] {
  const term = query.trim().toLowerCase();
  if (!term) return summaries;

  return summaries.filter((customer) => {
    if (customer.name.toLowerCase().includes(term)) return true;
    if (customer.phone.toLowerCase().includes(term)) return true;
    if (customer.key.toLowerCase().includes(term)) return true;
    if (customer.latestAddress?.toLowerCase().includes(term)) return true;
    return customer.orders.some((order) =>
      order.order_id.toLowerCase().includes(term) ||
      (order.customer_address && order.customer_address.toLowerCase().includes(term))
    );
  });
}

export function calculateCustomerMetrics(summaries: CustomerSummary[]): CustomerMetrics {
  const totalCustomers = summaries.length;
  let repeatCustomers = 0;
  let totalRecognizedSpend = 0;

  for (const s of summaries) {
    if (s.orderCount > 1) {
      repeatCustomers += 1;
    }
    totalRecognizedSpend += s.totalSpend;
  }

  return {
    totalCustomers,
    repeatCustomers,
    totalRecognizedSpend,
    averageRecognizedSpendPerCustomer: totalCustomers > 0 ? Math.round(totalRecognizedSpend / totalCustomers) : 0,
  };
}
