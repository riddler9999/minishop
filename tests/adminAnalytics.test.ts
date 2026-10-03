import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import type {AdminOrder} from '../src/domain/order.ts';
import {
  buildAnalyticsSummary,
  filterOrdersByTimeRange,
  deriveProductPerformance,
} from '../src/features/admin/lib/analyticsSummary.ts';

const page = fs.readFileSync(new URL('../src/features/admin/pages/Analytics.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');

function order(input: Partial<AdminOrder> & Pick<AdminOrder, 'order_id' | 'created_at' | 'grand_total' | 'status'>): AdminOrder {
  return {
    phone_key: input.customer_phone ? `phone:${input.customer_phone}` : '',
    items: [],
    item_total: input.grand_total,
    delivery_fee: 0,
    payment_method: 'cod',
    slip_url: null,
    ...input,
  };
}

describe('Admin Analytics V3 — Calculations & Domain Logic', () => {
  it('uses canonical recognized-sales semantics and excludes non-recognized statuses', () => {
    const summary = buildAnalyticsSummary([
      order({order_id: 'A', created_at: '2026-09-01T00:00:00.000Z', grand_total: 1000, status: 'checked'}),
      order({order_id: 'B', created_at: '2026-09-02T00:00:00.000Z', grand_total: 2000, status: 'shipped'}),
      order({order_id: 'C', created_at: '2026-09-03T00:00:00.000Z', grand_total: 3000, status: 'completed'}),
      order({order_id: 'D', created_at: '2026-09-04T00:00:00.000Z', grand_total: 4000, status: 'cancelled'}),
      order({order_id: 'E', created_at: '2026-09-05T00:00:00.000Z', grand_total: 5000, status: 'partial_checked'}),
      order({order_id: 'F', created_at: '2026-09-06T00:00:00.000Z', grand_total: 6000, status: 'pending_payment'}),
      order({order_id: 'G', created_at: '2026-09-07T00:00:00.000Z', grand_total: 7000, status: 'cod_pending'}),
    ], 'all');

    assert.equal(summary.recognizedSales, 6000); // 1000 + 2000 + 3000
    assert.equal(summary.orderCount, 7);
    assert.equal(summary.recognizedOrderCount, 3);
    assert.equal(summary.averageRecognizedOrderValue, 2000);
  });

  it('derives order-status distribution deterministically in canonical order', () => {
    const input = [
      order({order_id: '2', created_at: '2026-09-02T00:00:00.000Z', grand_total: 10, status: 'cancelled'}),
      order({order_id: '1', created_at: '2026-09-01T00:00:00.000Z', grand_total: 10, status: 'checked'}),
      order({order_id: '3', created_at: '2026-09-03T00:00:00.000Z', grand_total: 10, status: 'checked'}),
    ];
    const first = buildAnalyticsSummary(input, 'all');
    const second = buildAnalyticsSummary([...input].reverse(), 'all');

    assert.deepEqual(first.statusDistribution, second.statusDistribution);
    assert.deepEqual(first.statusDistribution, [
      {status: 'cod_pending', count: 0},
      {status: 'pending_payment', count: 0},
      {status: 'partial_checked', count: 0},
      {status: 'checked', count: 2},
      {status: 'shipped', count: 0},
      {status: 'completed', count: 0},
      {status: 'cancelled', count: 1},
    ]);
  });

  it('derives product performance accurately from recognized orders', () => {
    const orders: AdminOrder[] = [
      order({
        order_id: 'ORD-1',
        created_at: '2026-09-01T00:00:00.000Z',
        grand_total: 25000,
        status: 'completed',
        items: [
          {name: 'Linen Shirt', price: 10000, qty: 2},
          {name: 'Silk Scarf', price: 5000, qty: 1},
        ],
      }),
      order({
        order_id: 'ORD-2',
        created_at: '2026-09-02T00:00:00.000Z',
        grand_total: 15000,
        status: 'checked',
        items: [
          {name: 'Linen Shirt', price: 10000, qty: 1},
          {name: 'Cotton Pants', price: 5000, qty: 1},
        ],
      }),
      order({
        order_id: 'ORD-3',
        created_at: '2026-09-03T00:00:00.000Z',
        grand_total: 50000,
        status: 'cancelled', // Cancelled order must not count towards product recognized revenue
        items: [
          {name: 'Gold Ring', price: 50000, qty: 1},
        ],
      }),
    ];

    const performance = deriveProductPerformance(orders);
    assert.equal(performance.length, 3);
    assert.equal(performance[0].name, 'Linen Shirt');
    assert.equal(performance[0].unitsSold, 3);
    assert.equal(performance[0].revenue, 30000);
    assert.equal(performance[0].orderCount, 2);

    assert.equal(performance[1].name, 'Cotton Pants');
    assert.equal(performance[1].unitsSold, 1);
    assert.equal(performance[1].revenue, 5000);

    assert.equal(performance[2].name, 'Silk Scarf');
    assert.equal(performance[2].unitsSold, 1);
    assert.equal(performance[2].revenue, 5000);
  });

  it('computes customer metrics using authoritative order records without duplicating customer CRM', () => {
    const orders: AdminOrder[] = [
      order({
        order_id: 'ORD-1',
        created_at: '2026-09-01T00:00:00.000Z',
        customer_phone: '09123456789',
        customer_name: 'Daw Aye',
        grand_total: 10000,
        status: 'completed',
      }),
      order({
        order_id: 'ORD-2',
        created_at: '2026-09-02T00:00:00.000Z',
        customer_phone: '09123456789',
        customer_name: 'Daw Aye',
        grand_total: 15000,
        status: 'shipped',
      }),
      order({
        order_id: 'ORD-3',
        created_at: '2026-09-03T00:00:00.000Z',
        customer_phone: '09987654321',
        customer_name: 'U Ba',
        grand_total: 20000,
        status: 'completed',
      }),
    ];

    const summary = buildAnalyticsSummary(orders, 'all');
    assert.equal(summary.customerMetrics.totalCustomers, 2);
    assert.equal(summary.customerMetrics.repeatCustomers, 1);
    assert.equal(summary.customerMetrics.averageRecognizedSpendPerCustomer, 22500); // (25000 + 20000) / 2
  });

  it('filters orders by Yangon timezone date ranges correctly', () => {
    // 2026-10-03 in Yangon is UTC 2026-10-02T17:30:00Z to 2026-10-03T17:29:59Z
    const fixedNow = new Date('2026-10-03T10:00:00.000Z'); // 16:30 Yangon time on Oct 3

    const orders: AdminOrder[] = [
      order({order_id: 'TODAY', created_at: '2026-10-03T08:00:00.000Z', grand_total: 5000, status: 'completed'}),
      order({order_id: '3_DAYS_AGO', created_at: '2026-09-30T08:00:00.000Z', grand_total: 7000, status: 'completed'}),
      order({order_id: '20_DAYS_AGO', created_at: '2026-09-15T08:00:00.000Z', grand_total: 10000, status: 'completed'}),
      order({order_id: '40_DAYS_AGO', created_at: '2026-08-20T08:00:00.000Z', grand_total: 20000, status: 'completed'}),
    ];

    const todayOrders = filterOrdersByTimeRange(orders, 'today', fixedNow);
    assert.equal(todayOrders.length, 1);
    assert.equal(todayOrders[0].order_id, 'TODAY');

    const sevenDaysOrders = filterOrdersByTimeRange(orders, '7d', fixedNow);
    assert.equal(sevenDaysOrders.length, 2);

    const thirtyDaysOrders = filterOrdersByTimeRange(orders, '30d', fixedNow);
    assert.equal(thirtyDaysOrders.length, 3);

    const allOrders = filterOrdersByTimeRange(orders, 'all', fixedNow);
    assert.equal(allOrders.length, 4);
  });

  it('produces an explicit empty analytics state for zero orders', () => {
    const summary = buildAnalyticsSummary([], 'all');
    assert.equal(summary.isEmpty, true);
    assert.equal(summary.orderCount, 0);
    assert.equal(summary.recognizedSales, 0);
    assert.equal(summary.recognizedOrderCount, 0);
    assert.equal(summary.averageRecognizedOrderValue, 0);
    assert.equal(summary.topProducts.length, 0);
    assert.equal(summary.customerMetrics.totalCustomers, 0);
    assert.ok(summary.statusDistribution.every((item) => item.count === 0));
  });
});

describe('Admin Analytics V3 — UI Workspace & Component Standards', () => {
  it('renders a truthful separate analytics workspace with recoverable states and date filtering', () => {
    assert.match(page, /Analytics/);
    assert.match(page, /adminApi\.listOrders\(\)/);
    assert.match(page, /Loading analytics/);
    assert.match(page, /No analytics yet/);
    assert.match(page, /Could not load analytics/);
    assert.match(page, /Retry/);
    assert.match(page, /Recognized Sales/);
    assert.match(page, /Orders by Status/);
    assert.match(page, /Top Products/);
    assert.match(page, /Customer Insights/);
    assert.doesNotMatch(page, /createClient|requireSupabase|supabase\.from|from\(['"]orders['"]\)|from\(['"]products['"]\)/);
    assert.doesNotMatch(page, /conversion rate|visitor count|traffic source|ad spend|retention cohort|funnel step/i);
  });

  it('routes /admin/analytics to Analytics rather than Dashboard', () => {
    assert.match(app, /const Analytics = lazy\(\(\) => import\(['"]@\/features\/admin\/pages\/Analytics['"]\)\)/);
    assert.match(app, /path=["']analytics["'] element={<Analytics \/>}/);
    assert.doesNotMatch(app, /path=["']analytics["'] element={<Dashboard \/>}/);
    assert.match(nav, /label: 'Analytics', to: '\/admin\/analytics'/);
  });

  it('uses Charcoal + Mint design tokens and Admin primitives without unapproved colors', () => {
    assert.match(page, /AdminPageHeader/);
    assert.match(page, /AdminStatCard/);
    assert.match(page, /AdminSurface/);
    assert.match(page, /AdminLoadingState/);
    assert.match(page, /AdminEmptyState/);
    assert.match(page, /AdminErrorState/);
    assert.doesNotMatch(page, /violet-/);
    assert.doesNotMatch(page, /indigo-/);
    assert.doesNotMatch(page, /purple-/);
  });
});
