import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import type {AdminOrder} from '../src/domain/order.ts';
import {
  buildCustomerSummaries,
  calculateCustomerMetrics,
  filterCustomerSummaries,
  sortCustomerSummaries,
} from '../src/features/admin/lib/customerSummary.ts';

const page = fs.readFileSync(new URL('../src/features/admin/pages/Customers.tsx', import.meta.url), 'utf8');
const detail = fs.readFileSync(new URL('../src/features/admin/components/AdminCustomerDetail.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');

function order(input: Partial<AdminOrder> & Pick<AdminOrder, 'order_id' | 'phone_key' | 'created_at' | 'grand_total' | 'status'>): AdminOrder {
  return {
    items: [],
    item_total: input.grand_total,
    delivery_fee: 0,
    payment_method: 'cod',
    slip_url: null,
    ...input,
  };
}

describe('Admin Customers derived workspace - Domain & Aggregation', () => {
  it('groups deterministically by normalized phone identity and keeps newest customer identity', () => {
    const summaries = buildCustomerSummaries([
      order({
        order_id: 'ORD-1',
        phone_key: '959123456789',
        customer_phone: '09 123 456 789',
        customer_name: 'Old Name',
        customer_address: 'Old Address',
        created_at: '2026-09-01T10:00:00.000Z',
        grand_total: 10000,
        status: 'checked',
      }),
      order({
        order_id: 'ORD-2',
        phone_key: '959123456789',
        customer_phone: '09-123-456-789',
        customer_name: 'New Name',
        customer_address: 'New Address, Yangon',
        created_at: '2026-09-05T10:00:00.000Z',
        grand_total: 12000,
        status: 'completed',
      }),
    ]);
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.key, 'phone:959123456789');
    assert.equal(summaries[0]?.name, 'New Name');
    assert.equal(summaries[0]?.phone, '09-123-456-789');
    assert.equal(summaries[0]?.latestAddress, 'New Address, Yangon');
    assert.equal(summaries[0]?.orderCount, 2);
    assert.equal(summaries[0]?.recognizedOrderCount, 2);
    assert.equal(summaries[0]?.lastOrderId, 'ORD-2');
    assert.equal(summaries[0]?.lastOrderAt, '2026-09-05T10:00:00.000Z');
    assert.equal(summaries[0]?.firstOrderAt, '2026-09-01T10:00:00.000Z');
    assert.equal(summaries[0]?.orders.length, 2);
    assert.equal(summaries[0]?.orders[0].order_id, 'ORD-2'); // Newest first
  });

  it('counts spend only from recognized-sales statuses', () => {
    const [summary] = buildCustomerSummaries([
      order({order_id: 'A', phone_key: '0911', created_at: '2026-09-01T00:00:00.000Z', grand_total: 1000, status: 'checked'}),
      order({order_id: 'B', phone_key: '0911', created_at: '2026-09-02T00:00:00.000Z', grand_total: 2000, status: 'shipped'}),
      order({order_id: 'C', phone_key: '0911', created_at: '2026-09-03T00:00:00.000Z', grand_total: 3000, status: 'completed'}),
      order({order_id: 'D', phone_key: '0911', created_at: '2026-09-04T00:00:00.000Z', grand_total: 4000, status: 'cancelled'}),
      order({order_id: 'E', phone_key: '0911', created_at: '2026-09-05T00:00:00.000Z', grand_total: 5000, status: 'partial_checked'}),
      order({order_id: 'F', phone_key: '0911', created_at: '2026-09-06T00:00:00.000Z', grand_total: 6000, status: 'cod_pending'}),
      order({order_id: 'G', phone_key: '0911', created_at: '2026-09-07T00:00:00.000Z', grand_total: 7000, status: 'pending_payment'}),
    ]);
    assert.equal(summary?.totalSpend, 6000); // 1000 + 2000 + 3000
    assert.equal(summary?.recognizedOrderCount, 3);
    assert.equal(summary?.orderCount, 7);
  });

  it('uses deterministic legacy fallback identity when phone key is absent', () => {
    const summaries = buildCustomerSummaries([
      order({order_id: 'LEGACY-2', phone_key: '', customer_name: 'Legacy Buyer 2', customer_phone: '', created_at: '2026-09-02T00:00:00.000Z', grand_total: 5000, status: 'checked'}),
      order({order_id: 'LEGACY-1', phone_key: '', customer_name: 'Legacy Buyer 1', customer_phone: '', created_at: '2026-09-01T00:00:00.000Z', grand_total: 3000, status: 'checked'}),
    ]);
    assert.equal(summaries.length, 2);
    assert.equal(summaries[0]?.key, 'order:LEGACY-2');
    assert.equal(summaries[1]?.key, 'order:LEGACY-1');
  });

  it('calculates metrics across all customer summaries accurately', () => {
    const summaries = buildCustomerSummaries([
      order({order_id: '1', phone_key: 'P1', created_at: '2026-09-01T00:00:00.000Z', grand_total: 10000, status: 'completed'}),
      order({order_id: '2', phone_key: 'P1', created_at: '2026-09-02T00:00:00.000Z', grand_total: 20000, status: 'completed'}),
      order({order_id: '3', phone_key: 'P2', created_at: '2026-09-03T00:00:00.000Z', grand_total: 5000, status: 'checked'}),
      order({order_id: '4', phone_key: 'P3', created_at: '2026-09-04T00:00:00.000Z', grand_total: 8000, status: 'cancelled'}),
    ]);
    const metrics = calculateCustomerMetrics(summaries);
    assert.equal(metrics.totalCustomers, 3);
    assert.equal(metrics.repeatCustomers, 1); // P1 has 2 orders
    assert.equal(metrics.totalRecognizedSpend, 35000); // 30000 + 5000 + 0
    assert.equal(metrics.averageRecognizedSpendPerCustomer, Math.round(35000 / 3));
  });

  it('sorts customer summaries deterministically by recent, spend, orders, and name', () => {
    const raw = buildCustomerSummaries([
      order({order_id: '1', phone_key: 'A', customer_name: 'Alice', created_at: '2026-09-01T00:00:00.000Z', grand_total: 10000, status: 'completed'}),
      order({order_id: '2', phone_key: 'B', customer_name: 'Bob', created_at: '2026-09-05T00:00:00.000Z', grand_total: 5000, status: 'completed'}),
      order({order_id: '3', phone_key: 'C', customer_name: 'Charlie', created_at: '2026-09-03T00:00:00.000Z', grand_total: 50000, status: 'completed'}),
      order({order_id: '4', phone_key: 'A', customer_name: 'Alice', created_at: '2026-09-04T00:00:00.000Z', grand_total: 20000, status: 'completed'}),
      order({order_id: '5', phone_key: 'A', customer_name: 'Alice', created_at: '2026-09-06T00:00:00.000Z', grand_total: 1000, status: 'completed'}),
    ]);

    const byRecent = sortCustomerSummaries(raw, 'recent');
    assert.equal(byRecent[0].name, 'Alice'); // 2026-09-06
    assert.equal(byRecent[1].name, 'Bob');   // 2026-09-05
    assert.equal(byRecent[2].name, 'Charlie'); // 2026-09-03

    const bySpend = sortCustomerSummaries(raw, 'spend');
    assert.equal(bySpend[0].name, 'Charlie'); // 50000
    assert.equal(bySpend[1].name, 'Alice');   // 31000
    assert.equal(bySpend[2].name, 'Bob');     // 5000

    const byOrders = sortCustomerSummaries(raw, 'orders');
    assert.equal(byOrders[0].name, 'Alice'); // 3 orders
    assert.equal(byOrders[1].orderCount, 1);

    const byName = sortCustomerSummaries(raw, 'name');
    assert.equal(byName[0].name, 'Alice');
    assert.equal(byName[1].name, 'Bob');
    assert.equal(byName[2].name, 'Charlie');
  });

  it('filters customer summaries by name, phone, address, and order ID', () => {
    const raw = buildCustomerSummaries([
      order({order_id: 'ORD-101', phone_key: '09111', customer_name: 'Daw Aye', customer_phone: '09111', customer_address: 'Bahan, Yangon', created_at: '2026-09-01T00:00:00.000Z', grand_total: 10000, status: 'completed'}),
      order({order_id: 'ORD-202', phone_key: '09222', customer_name: 'U Hla', customer_phone: '09222', customer_address: 'Mandalay', created_at: '2026-09-02T00:00:00.000Z', grand_total: 20000, status: 'completed'}),
    ]);

    assert.equal(filterCustomerSummaries(raw, 'Daw').length, 1);
    assert.equal(filterCustomerSummaries(raw, '09222').length, 1);
    assert.equal(filterCustomerSummaries(raw, 'Bahan').length, 1);
    assert.equal(filterCustomerSummaries(raw, 'ORD-202').length, 1);
    assert.equal(filterCustomerSummaries(raw, 'Nonexistent').length, 0);
  });
});

describe('Admin Customers V3 UI workspace & detail components', () => {
  it('renders a read-only searchable workspace with loading, empty, error and retry states', () => {
    assert.match(page, /Customers/);
    assert.match(page, /Search customers/);
    assert.match(page, /adminApi\.listOrders\(\)/);
    assert.match(page, /Loading customers/);
    assert.match(page, /No customers yet/);
    assert.match(page, /Could not load customers/);
    assert.match(page, /Retry/);
    assert.doesNotMatch(page, /create|update|delete|save customer|edit customer/i);
    assert.doesNotMatch(page, /requireSupabase|supabase\.from|from\(['"]orders['"]\)/);
  });

  it('routes Customers through the existing protected admin console and makes nav item routable', () => {
    assert.match(app, /const Customers = lazy\(\(\) => import\(['"]@\/features\/admin\/pages\/Customers['"]\)\)/);
    assert.match(app, /path=["']customers["'] element={<Customers \/>}/);
    assert.match(nav, /label: 'Customers', to: '\/admin\/customers'/);
  });

  it('uses Charcoal + Mint design tokens and Admin primitives without unapproved colors', () => {
    assert.match(page, /AdminPageHeader/);
    assert.match(page, /AdminStatCard/);
    assert.match(page, /AdminButton/);
    assert.match(page, /AdminLoadingState/);
    assert.match(page, /AdminEmptyState/);
    assert.match(page, /AdminErrorState/);
    assert.doesNotMatch(page, /violet-/);
    assert.doesNotMatch(page, /indigo-/);
    assert.doesNotMatch(detail, /violet-/);
    assert.doesNotMatch(detail, /indigo-/);
  });

  it('renders a full accessible customer detail drawer with order history', () => {
    assert.match(detail, /role="dialog"/);
    assert.match(detail, /aria-modal="true"/);
    assert.match(detail, /aria-labelledby="customer-detail-title"/);
    assert.match(detail, /Customer Information/);
    assert.match(detail, /Order History/);
    assert.match(detail, /Total Spend/);
    assert.match(detail, /useModalA11y/);
    assert.match(detail, /Close customer details/);
  });

  it('supports desktop table view and deliberate mobile card view with min 44px touch targets', () => {
    assert.match(page, /hidden md:block overflow-x-auto/);
    assert.match(page, /md:hidden/);
    assert.match(page, /min-h-\[44px\]/);
  });
});
