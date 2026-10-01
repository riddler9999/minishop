import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import type {AdminOrder} from '../src/domain/order.ts';
import {buildAnalyticsSummary} from '../src/features/admin/lib/analyticsSummary.ts';

const page = fs.readFileSync(new URL('../src/features/admin/pages/Analytics.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');

function order(input: Partial<AdminOrder> & Pick<AdminOrder, 'order_id' | 'created_at' | 'grand_total' | 'status'>): AdminOrder {
  return {
    phone_key: '',
    items: [],
    item_total: input.grand_total,
    delivery_fee: 0,
    payment_method: 'cod',
    slip_url: null,
    ...input,
  };
}

describe('Admin Analytics V2', () => {
  it('uses canonical recognized-sales semantics and excludes non-recognized statuses', () => {
    const summary = buildAnalyticsSummary([
      order({order_id:'A', created_at:'2026-09-01T00:00:00.000Z', grand_total:1000, status:'checked'}),
      order({order_id:'B', created_at:'2026-09-02T00:00:00.000Z', grand_total:2000, status:'shipped'}),
      order({order_id:'C', created_at:'2026-09-03T00:00:00.000Z', grand_total:3000, status:'completed'}),
      order({order_id:'D', created_at:'2026-09-04T00:00:00.000Z', grand_total:4000, status:'cancelled'}),
      order({order_id:'E', created_at:'2026-09-05T00:00:00.000Z', grand_total:5000, status:'partial_checked'}),
      order({order_id:'F', created_at:'2026-09-06T00:00:00.000Z', grand_total:6000, status:'pending_payment'}),
      order({order_id:'G', created_at:'2026-09-07T00:00:00.000Z', grand_total:7000, status:'cod_pending'}),
    ]);

    assert.equal(summary.recognizedSales, 6000);
    assert.equal(summary.orderCount, 7);
    assert.equal(summary.recognizedOrderCount, 3);
  });

  it('derives order-status distribution deterministically', () => {
    const input = [
      order({order_id:'2', created_at:'2026-09-02T00:00:00.000Z', grand_total:10, status:'cancelled'}),
      order({order_id:'1', created_at:'2026-09-01T00:00:00.000Z', grand_total:10, status:'checked'}),
      order({order_id:'3', created_at:'2026-09-03T00:00:00.000Z', grand_total:10, status:'checked'}),
    ];
    const first = buildAnalyticsSummary(input);
    const second = buildAnalyticsSummary([...input].reverse());

    assert.deepEqual(first.statusDistribution, second.statusDistribution);
    assert.deepEqual(first.statusDistribution, [
      {status:'cod_pending', count:0},
      {status:'pending_payment', count:0},
      {status:'partial_checked', count:0},
      {status:'checked', count:2},
      {status:'shipped', count:0},
      {status:'completed', count:0},
      {status:'cancelled', count:1},
    ]);
  });

  it('produces an explicit empty analytics state', () => {
    const summary = buildAnalyticsSummary([]);
    assert.equal(summary.isEmpty, true);
    assert.equal(summary.orderCount, 0);
    assert.equal(summary.recognizedSales, 0);
    assert.equal(summary.recognizedOrderCount, 0);
    assert.ok(summary.statusDistribution.every((item) => item.count === 0));
  });

  it('renders a truthful separate analytics workspace with recoverable states', () => {
    assert.match(page, /Analytics/);
    assert.match(page, /adminApi\.listOrders\(\)/);
    assert.match(page, /Loading analytics/);
    assert.match(page, /No analytics yet/);
    assert.match(page, /Could not load analytics/);
    assert.match(page, /Retry/);
    assert.doesNotMatch(page, /createClient|requireSupabase|supabase\.from|from\(['"]orders['"]\)|from\(['"]products['"]\)/);
    assert.doesNotMatch(page, /conversion|visitor|traffic|retention|attribution|funnel/i);
  });

  it('routes /admin/analytics to Analytics rather than Dashboard', () => {
    assert.match(app, /import Analytics from ['"]@\/features\/admin\/pages\/Analytics['"]/);
    assert.match(app, /path=["']analytics["'] element={<Analytics \/>}/);
    assert.doesNotMatch(app, /path=["']analytics["'] element={<Dashboard \/>}/);
  });
});
