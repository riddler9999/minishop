import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const dashboard = fs.readFileSync(new URL('../src/features/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');

describe('Admin Dashboard metrics contract', () => {
  it('preserves the recognized-sales source of truth', async () => {
    const {RECOGNIZED_SALES_STATUSES} = await import('../src/domain/orderStatus.ts');
    assert.deepEqual(RECOGNIZED_SALES_STATUSES, ['checked', 'shipped', 'completed']);
    assert.doesNotMatch(dashboard, /partial_checked[^\n]*recognized/i);
  });

  it('keeps dashboard data on trusted admin API boundaries', () => {
    assert.match(dashboard, /adminApi\.listProducts\(\)/);
    assert.match(dashboard, /adminApi\.listOrders\(\)/);
    assert.doesNotMatch(dashboard, /createClient|supabase\.from|from\(['"]orders['"]\)|from\(['"]products['"]\)/);
  });
});
