import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');

describe('Admin V2 navigation contract', () => {
  it('pins the exact English-first primary navigation order', () => {
    const labels = [...nav.matchAll(/\{label: '([^']+)'/g)].map((match) => match[1]);
    assert.deepEqual(labels.slice(0, 13), [
      'Dashboard',
      'Orders',
      'Products',
      'Customers',
      'Store',
      'Store Builder',
      'Navigation',
      'Domains',
      'Policies',
      'Marketing',
      'Analytics',
      'Settings',
      'Billing',
    ]);
  });

  it('keeps Store submenu entries exact', () => {
    for (const label of ['Store Builder', 'Navigation', 'Domains', 'Policies']) {
      assert.match(nav, new RegExp(`label: ['"]${label}['"]`));
    }
  });

  it('preserves existing production admin routes', () => {
    for (const route of ['products', 'orders', 'shipping', 'billing', 'design', 'online-store/themes', 'online-store/themes/customize', 'analytics', 'settings']) {
      assert.match(app, new RegExp(`path=["']${route.replace('/', '\\/')}["']`), `missing route: ${route}`);
    }
  });

  it('does not invent routable backend functionality for future nav items', () => {
    assert.doesNotMatch(nav, /to: ['"]\/admin\/customers['"]/);
    assert.doesNotMatch(nav, /to: ['"]\/admin\/marketing['"]/);
  });
});
