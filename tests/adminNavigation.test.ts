import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../src/features/admin/components/AdminLayout.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');

describe('Store Builder #112 admin information architecture', () => {
  it('exposes only seller navigation with real destinations in the admin shell', () => {
    for (const label of ['Home', 'Orders', 'Products', 'Online Store', 'Analytics', 'Shipping', 'Settings']) {
      assert.match(layout, new RegExp(`label: ['"]${label}['"]`), `missing nav label: ${label}`);
    }
    assert.doesNotMatch(layout, /label: ['"]Marketing['"]/);
  });

  it('routes Online Store Themes and lifecycle Customize separately', () => {
    assert.match(app, /path=["']online-store\/themes["']/);
    assert.match(app, /path=["']online-store\/themes\/customize["'] element={<LifecycleStoreBuilder \/>}/);
  });

  it('preserves the legacy Store Design route until lifecycle migration cutover', () => {
    assert.match(app, /import StoreDesign from ['"]@\/features\/shop\/pages\/StoreDesign['"]/);
    assert.match(app, /path=["']design["'] element={<StoreDesign \/>}/);
  });

  it('keeps existing business routes addressable', () => {
    for (const route of ['products', 'orders', 'shipping', 'billing', 'design', 'settings']) {
      assert.match(app, new RegExp(`path=["']${route}["']`), `missing existing admin route: ${route}`);
    }
  });
});
