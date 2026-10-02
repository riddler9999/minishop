import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const dashboard = fs.readFileSync(new URL('../src/features/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');
const action = fs.readFileSync(new URL('../src/features/admin/components/ActionRequiredPanel.tsx', import.meta.url), 'utf8');
const recent = fs.readFileSync(new URL('../src/features/admin/components/RecentOrdersPanel.tsx', import.meta.url), 'utf8');
const low = fs.readFileSync(new URL('../src/features/admin/components/LowStockPanel.tsx', import.meta.url), 'utf8');

describe('Admin V2 operational dashboard', () => {
  it('pins the operational English-first summary labels', () => {
    for (const label of ['Dashboard', 'Sales', 'Orders', 'Pending Orders', 'Customers']) {
      assert.match(dashboard, new RegExp(label));
    }
    assert.doesNotMatch(dashboard, /Sale Analytics|Recognized Sales Trend/);
  });

  it('exposes action required, recent orders, and low stock panels', () => {
    assert.match(action, /Action Required/);
    assert.match(recent, /Recent Orders/);
    assert.match(low, /Low Stock/);
  });

  it('provides meaningful empty and recovery actions', () => {
    assert.match(dashboard, /Add your first product/);
    assert.match(dashboard, /Go to Products/);
    assert.match(dashboard, /Some dashboard data could not be loaded/);
    assert.match(dashboard, /onRetry=\{retry\}/);
    assert.match(action, /No orders need attention/);
    assert.match(recent, /No orders yet/);
    assert.match(low, /Stock levels look healthy/);
  });
});
