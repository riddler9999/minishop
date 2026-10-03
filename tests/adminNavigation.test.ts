import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');

describe('Admin V3 navigation contract', () => {
  it('pins the exact English-first primary navigation order', () => {
    const primaryBlock = nav.match(/export const ADMIN_NAV_ITEMS:[\s\S]*?\n\];/);
    assert.ok(primaryBlock, 'ADMIN_NAV_ITEMS block not found');
    const labels = [...primaryBlock[0].matchAll(/label:\s*'([^']+)'/g)].map((match) => match[1]);
    assert.deepEqual(labels, [
      'Dashboard',
      'Orders',
      'Products',
      'Customers',
      'Store',
      'Store Builder',
      'Themes',
      'Analytics',
      'Settings',
    ]);
  });

  it('keeps Store submenu entries exact for Admin V3 (Store Builder & Themes)', () => {
    assert.match(nav, /label:\s*['"]Store Builder['"]/);
    assert.match(nav, /label:\s*['"]Themes['"]/);
    // Domains and Policies moved under Settings, not in Store submenu
    const storeSubmenu = nav.match(/label:\s*'Store'[\s\S]*?children:\s*\[([\s\S]*?)\]/);
    assert.ok(storeSubmenu, 'Store submenu not found');
    const storeChildren = [...storeSubmenu[1].matchAll(/label:\s*'([^']+)'/g)].map((m) => m[1]);
    assert.deepEqual(storeChildren, ['Store Builder', 'Themes']);
  });

  it('removes Marketing and moves Billing out of primary navigation', () => {
    const primaryBlock = nav.match(/export const ADMIN_NAV_ITEMS:[\s\S]*?\n\];/);
    assert.ok(primaryBlock, 'ADMIN_NAV_ITEMS block not found');
    assert.doesNotMatch(primaryBlock[0], /label:\s*['"]Marketing['"]/);
    assert.doesNotMatch(primaryBlock[0], /label:\s*['"]Billing['"]/);
  });

  it('preserves existing production admin routes and compatibility', () => {
    for (const route of ['products', 'orders', 'shipping', 'billing', 'design', 'online-store/themes', 'online-store/themes/customize', 'analytics', 'settings']) {
      assert.match(app, new RegExp(`path=["']${route.replace('/', '\\/')}["']`), `missing route: ${route}`);
    }
  });

  it('routes Customers with valid component element', () => {
    assert.match(nav, /label: 'Customers', to: '\/admin\/customers'/);
    assert.match(app, /path=["']customers["'] element={<Customers \/>}/);
  });
});
