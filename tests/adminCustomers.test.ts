import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import type {AdminOrder} from '../src/domain/order.ts';
import {buildCustomerSummaries} from '../src/features/admin/lib/customerSummary.ts';

const page = fs.readFileSync(new URL('../src/features/admin/pages/Customers.tsx', import.meta.url), 'utf8');
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

describe('Admin Customers derived workspace', () => {
  it('groups deterministically by normalized phone identity and keeps newest customer identity', () => {
    const summaries = buildCustomerSummaries([
      order({order_id:'ORD-1', phone_key:'959123456789', customer_phone:'09 123 456 789', customer_name:'Old Name', created_at:'2026-09-01T10:00:00.000Z', grand_total:10000, status:'checked'}),
      order({order_id:'ORD-2', phone_key:'959123456789', customer_phone:'09-123-456-789', customer_name:'New Name', created_at:'2026-09-05T10:00:00.000Z', grand_total:12000, status:'completed'}),
    ]);
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0]?.key, 'phone:959123456789');
    assert.equal(summaries[0]?.name, 'New Name');
    assert.equal(summaries[0]?.phone, '09-123-456-789');
    assert.equal(summaries[0]?.orderCount, 2);
    assert.equal(summaries[0]?.lastOrderId, 'ORD-2');
  });

  it('counts spend only from recognized-sales statuses', () => {
    const [summary] = buildCustomerSummaries([
      order({order_id:'A', phone_key:'0911', created_at:'2026-09-01T00:00:00.000Z', grand_total:1000, status:'checked'}),
      order({order_id:'B', phone_key:'0911', created_at:'2026-09-02T00:00:00.000Z', grand_total:2000, status:'shipped'}),
      order({order_id:'C', phone_key:'0911', created_at:'2026-09-03T00:00:00.000Z', grand_total:3000, status:'completed'}),
      order({order_id:'D', phone_key:'0911', created_at:'2026-09-04T00:00:00.000Z', grand_total:4000, status:'cancelled'}),
      order({order_id:'E', phone_key:'0911', created_at:'2026-09-05T00:00:00.000Z', grand_total:5000, status:'partial_checked'}),
    ]);
    assert.equal(summary?.totalSpend, 6000);
    assert.equal(summary?.orderCount, 5);
  });

  it('uses deterministic legacy fallback identity when phone key is absent', () => {
    const summaries = buildCustomerSummaries([
      order({order_id:'LEGACY-2', phone_key:'', customer_name:'Legacy Buyer', customer_phone:'', created_at:'2026-09-02T00:00:00.000Z', grand_total:5000, status:'checked'}),
      order({order_id:'LEGACY-1', phone_key:'', customer_name:'Legacy Buyer', customer_phone:'', created_at:'2026-09-01T00:00:00.000Z', grand_total:5000, status:'checked'}),
    ]);
    assert.equal(summaries.length, 2);
    assert.equal(summaries[0]?.key, 'order:LEGACY-2');
  });

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
    assert.match(app, /import Customers from ['"]@\/features\/admin\/pages\/Customers['"]/);
    assert.match(app, /path=["']customers["'] element={<Customers \/>}/);
    assert.match(nav, /label: 'Customers', to: '\/admin\/customers'/);
  });
});
