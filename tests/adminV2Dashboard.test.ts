import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const dashboard = fs.readFileSync(new URL('../src/features/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');
const action = fs.readFileSync(new URL('../src/features/admin/components/ActionRequiredPanel.tsx', import.meta.url), 'utf8');
const recent = fs.readFileSync(new URL('../src/features/admin/components/RecentOrdersPanel.tsx', import.meta.url), 'utf8');
const low = fs.readFileSync(new URL('../src/features/admin/components/LowStockPanel.tsx', import.meta.url), 'utf8');
const salesOverviewPath = new URL('../src/features/admin/components/SalesOverviewPanel.tsx', import.meta.url);
const ordersByStatusPath = new URL('../src/features/admin/components/OrdersByStatusPanel.tsx', import.meta.url);

describe('Admin V2 operational dashboard', () => {
  it('pins the operational English-first summary labels', () => {
    for (const label of ['Dashboard', 'Sales', 'Orders', 'Pending Orders', 'Customers']) {
      assert.match(dashboard, new RegExp(label));
    }
    assert.doesNotMatch(dashboard, /Sale Analytics|Recognized Sales Trend/);
  });

  it('exposes action required, recent orders, low stock, sales overview, and orders by status panels', () => {
    assert.match(action, /Action Required/);
    assert.match(recent, /Recent Orders/);
    assert.match(low, /Low Stock/);
    assert.match(dashboard, /SalesOverviewPanel/);
    assert.match(dashboard, /OrdersByStatusPanel/);
    assert.ok(fs.existsSync(salesOverviewPath), 'SalesOverviewPanel.tsx must exist');
    assert.ok(fs.existsSync(ordersByStatusPath), 'OrdersByStatusPanel.tsx must exist');
    const salesOverview = fs.readFileSync(salesOverviewPath, 'utf8');
    const ordersByStatus = fs.readFileSync(ordersByStatusPath, 'utf8');
    assert.match(salesOverview, /Sales Overview/);
    assert.match(ordersByStatus, /Orders by Status/);
  });

  it('provides meaningful empty and recovery actions', () => {
    assert.match(dashboard, /Add your first product/);
    assert.match(dashboard, /Go to Products/);
    assert.match(dashboard, /Some dashboard data could not be loaded/);
    assert.match(dashboard, /onRetry=\{retry\}/);
    assert.match(action, /No orders need attention/);
    assert.match(recent, /No orders yet/);
    assert.match(low, /Stock levels look healthy/);
    if (fs.existsSync(salesOverviewPath)) {
      const salesOverview = fs.readFileSync(salesOverviewPath, 'utf8');
      assert.match(salesOverview, /No recognized sales in this period/);
    }
    if (fs.existsSync(ordersByStatusPath)) {
      const ordersByStatus = fs.readFileSync(ordersByStatusPath, 'utf8');
      assert.match(ordersByStatus, /No orders yet/);
    }
  });

  it('follows Charcoal + Mint design tokens without obsolete violet styling', () => {
    assert.doesNotMatch(dashboard, /text-violet|bg-violet|border-violet/);
    assert.doesNotMatch(action, /text-violet|bg-violet/);
    assert.doesNotMatch(recent, /text-violet|bg-violet/);
    assert.doesNotMatch(low, /text-violet|bg-violet/);
  });

  it('maintains responsive layout structures for mobile (375-414px) and desktop', () => {
    assert.match(dashboard, /grid gap-3 sm:grid-cols-2 xl:grid-cols-4/);
    assert.match(dashboard, /minmax\(0/);
    assert.doesNotMatch(dashboard, /w-\[\d+px\]/);
  });

  it('uses Mint accent tokens and Yangon timezone window for Sales Overview', () => {
    const salesOverview = fs.readFileSync(salesOverviewPath, 'utf8');
    assert.match(salesOverview, /#35B99D/);
    assert.match(salesOverview, /Asia\/Yangon/);
    assert.match(salesOverview, /yangonDayKey/);
    assert.match(salesOverview, /RECOGNIZED_SALES_STATUSES/);
  });

  it('correctly maps canonical order statuses in Orders by Status', async () => {
    const {buildAnalyticsSummary, ANALYTICS_STATUS_ORDER} = await import('../src/features/admin/lib/analyticsSummary.ts');
    assert.deepEqual(ANALYTICS_STATUS_ORDER, [
      'cod_pending',
      'pending_payment',
      'partial_checked',
      'checked',
      'shipped',
      'completed',
      'cancelled',
    ]);

    const mockOrders: any[] = [
      {status: 'checked', grand_total: 10000},
      {status: 'shipped', grand_total: 20000},
      {status: 'completed', grand_total: 30000},
      {status: 'pending_payment', grand_total: 15000},
      {status: 'partial_checked', grand_total: 12000},
      {status: 'cancelled', grand_total: 50000},
    ];

    const summary = buildAnalyticsSummary(mockOrders);
    assert.equal(summary.orderCount, 6);
    assert.equal(summary.recognizedOrderCount, 3);
    assert.equal(summary.recognizedSales, 60000);
    assert.equal(summary.averageRecognizedOrderValue, 20000);

    const checkedItem = summary.statusDistribution.find((s) => s.status === 'checked');
    assert.equal(checkedItem?.count, 1);
    const pendingItem = summary.statusDistribution.find((s) => s.status === 'pending_payment');
    assert.equal(pendingItem?.count, 1);
  });
});
