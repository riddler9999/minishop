import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const ordersApi = readFileSync(new URL('../src/features/orders/api/admin.ts', import.meta.url), 'utf8');
const productsApi = readFileSync(new URL('../src/features/catalog/api/admin.ts', import.meta.url), 'utf8');
const ordersPage = readFileSync(new URL('../src/features/orders/pages/AdminOrders.tsx', import.meta.url), 'utf8');
const productsPage = readFileSync(new URL('../src/features/catalog/pages/AdminProducts.tsx', import.meta.url), 'utf8');
const superadminApi = readFileSync(new URL('../api/superadmin.ts', import.meta.url), 'utf8');
const superadminPage = readFileSync(new URL('../src/features/superadmin/pages/SuperAdminDashboard.tsx', import.meta.url), 'utf8');

test('seller order pagination uses a stable created_at + id cursor', () => {
  assert.match(ordersApi, /order\('created_at',[\s\S]*?order\('id'/);
  assert.match(ordersApi, /created_at\.lt\.\$\{cursor\.created_at\}.*id\.lt\.\$\{cursor\.id\}/s);
  assert.match(ordersApi, /limit\(limit \+ 1\)/);
});

test('seller product pagination covers same-date ties and null arrival dates', () => {
  assert.match(productsApi, /order\('arrival_date',[\s\S]*?order\('id'/);
  assert.match(productsApi, /arrival_date\.lt\.\$\{cursor\.arrival_date\}.*id\.lt\.\$\{cursor\.id\}.*arrival_date\.is\.null/s);
  assert.match(productsApi, /query = query\.is\('arrival_date', null\)\.lt\('id', cursor\.id\)/);
});

test('seller order and product pages expose next-page controls', () => {
  assert.match(ordersPage, /adminApi\.listOrders\(\{cursor: nextCursor\}\)/);
  assert.match(ordersPage, /nextCursor && !q\.trim\(\) && filter === 'all'/);
  assert.match(productsPage, /adminApi\.listProducts\(\{cursor: nextCursor\}\)/);
  assert.match(productsPage, /nextCursor && !q\.trim\(\)/);
});

test('superadmin pagination is compound-key stable and proof generation is lazy', () => {
  assert.match(superadminApi, /created_at\.lt\.\$\{cursor\.created_at\}.*\$\{keyColumn\}\.lt\.\$\{cursor\.id\}/s);
  assert.match(superadminApi, /rpc\('superadmin_platform_metrics'\)/);
  assert.equal((superadminApi.match(/createSignedUrl\(/g) || []).length, 1);
  assert.match(superadminApi, /if \(proofType && proofId\)[\s\S]*createSignedUrl\(/);
  assert.match(superadminPage, /openProof\('application'/);
  assert.match(superadminPage, /openProof\('pack'/);
  assert.match(superadminPage, /loadMore\('shops'\)/);
  assert.match(superadminPage, /loadMore\('applications'\)/);
  assert.match(superadminPage, /loadMore\('packs'\)/);
});
