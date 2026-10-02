import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../src/features/orders/pages/AdminOrders.tsx', import.meta.url), 'utf8');
const table = readFileSync(new URL('../src/features/orders/components/AdminOrdersTable.tsx', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../src/features/orders/components/AdminOrderDetail.tsx', import.meta.url), 'utf8');
const status = readFileSync(new URL('../src/domain/orderStatus.ts', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/features/orders/api/admin.ts', import.meta.url), 'utf8');

test('Orders V2 keeps canonical order statuses as the source of truth', () => {
  assert.match(status, /export const ADMIN_STATUS_OPTIONS/);
  assert.match(table, /statusMeta\(order\.status\)/);
  assert.match(detail, /ADMIN_STATUS_OPTIONS/);
  assert.doesNotMatch(page, /const\s+ORDER_STATUS\s*=/);
});

test('Orders V2 list makes operational fields scannable', () => {
  assert.match(table, /Order/);
  assert.match(table, /Customer/);
  assert.match(table, /Payment/);
  assert.match(table, /Fulfillment/);
  assert.match(table, /Amount/);
  assert.match(table, /Status/);
  assert.match(table, /payment_method/);
  assert.match(table, /grand_total/);
});

test('Orders V2 detail exposes current payment verification and existing status actions only', () => {
  assert.match(detail, /Payment/);
  assert.match(detail, /Delivery/);
  assert.match(detail, /Items/);
  assert.match(detail, /paymentRefTail/);
  assert.match(detail, /updateOrderStatus/);
  assert.match(detail, /pending_payment/);
  assert.match(detail, /partial_checked/);
  assert.doesNotMatch(detail, /refund|return order|restock|archive/i);
});

test('Orders V2 preserves the trusted order API boundary', () => {
  assert.match(page, /adminApi\.listOrders/);
  assert.match(detail, /adminApi\.updateOrderStatus/);
  assert.doesNotMatch(page, /requireSupabase|\.from\(['"]orders['"]\)/);
  assert.doesNotMatch(table, /requireSupabase|\.from\(['"]orders['"]\)/);
  assert.doesNotMatch(detail, /requireSupabase|\.from\(['"]orders['"]\)/);
  assert.match(api, /resolveOwnShopId/);
  assert.match(api, /update_order_status_and_notify/);
});

test('Orders V2 has recoverable list failure UI with Retry', () => {
  assert.match(page, /Retry/);
  assert.match(page, /catch/);
});

test('Orders V2 keeps seller pagination behavior', () => {
  assert.match(page, /adminApi\.listOrders\(\{cursor: nextCursor\}\)/);
  assert.match(page, /nextCursor && !q\.trim\(\) && filter === 'all'/);
});
