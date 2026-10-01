import type {AdminOrder} from '@/domain/order';
import {RECOGNIZED_SALES_STATUSES} from '@/domain/orderStatus';

export interface CustomerSummary {
  key: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderId: string;
  lastOrderAt: string;
}

const recognizedStatuses = new Set<string>(RECOGNIZED_SALES_STATUSES);

function identityKey(order: AdminOrder): string {
  const phoneKey = order.phone_key?.trim();
  if (phoneKey) return `phone:${phoneKey}`;
  return `order:${order.order_id}`;
}

export function buildCustomerSummaries(orders: AdminOrder[]): CustomerSummary[] {
  const groups = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const key = identityKey(order);
    const existing = groups.get(key);
    const recognized = recognizedStatuses.has(order.status) ? order.grand_total : 0;

    if (!existing) {
      groups.set(key, {
        key,
        name: order.customer_name?.trim() || 'Unknown customer',
        phone: order.customer_phone?.trim() || '',
        orderCount: 1,
        totalSpend: recognized,
        lastOrderId: order.order_id,
        lastOrderAt: order.created_at,
      });
      continue;
    }

    existing.orderCount += 1;
    existing.totalSpend += recognized;

    if (new Date(order.created_at).getTime() > new Date(existing.lastOrderAt).getTime()) {
      existing.name = order.customer_name?.trim() || existing.name;
      existing.phone = order.customer_phone?.trim() || existing.phone;
      existing.lastOrderId = order.order_id;
      existing.lastOrderAt = order.created_at;
    }
  }

  return [...groups.values()].sort((a, b) => {
    const timeDelta = new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
    if (timeDelta !== 0) return timeDelta;
    return a.key.localeCompare(b.key);
  });
}
