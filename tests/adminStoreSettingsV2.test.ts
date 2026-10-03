import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/features/shop/pages/Settings.tsx', import.meta.url), 'utf8');
const shipping = fs.readFileSync(new URL('../src/features/shipping/pages/AdminShipping.tsx', import.meta.url), 'utf8');
const storeNavigation = fs.readFileSync(new URL('../src/features/shop/pages/StoreNavigation.tsx', import.meta.url), 'utf8');
const storeDomains = fs.readFileSync(new URL('../src/features/shop/pages/StoreDomains.tsx', import.meta.url), 'utf8');
const storePolicies = fs.readFileSync(new URL('../src/features/shop/pages/StorePolicies.tsx', import.meta.url), 'utf8');
const settingsPayments = fs.readFileSync(new URL('../src/features/shop/pages/SettingsPayments.tsx', import.meta.url), 'utf8');
const settingsUsers = fs.readFileSync(new URL('../src/features/shop/pages/SettingsUsers.tsx', import.meta.url), 'utf8');

describe('Admin Settings Hub V3 — Architecture & Navigation', () => {
  it('organizes all 11 configuration categories in Settings Hub', () => {
    // 1. General / Store details
    assert.match(settings, /General|Store details/i);
    // 2. Plan and billing
    assert.match(settings, /Plan & Billing|Billing/i);
    // 3. Users and permissions
    assert.match(settings, /Users & Permissions|Users/i);
    // 4. Payments
    assert.match(settings, /Payments/i);
    // 5. Checkout
    assert.match(settings, /Checkout/i);
    // 6. Shipping and delivery
    assert.match(settings, /Shipping/i);
    // 7. Domains
    assert.match(settings, /Domains/i);
    // 8. Policies
    assert.match(settings, /Policies/i);
    // 9. Notifications
    assert.match(settings, /Notifications/i);
    // 10. Customer privacy
    assert.match(settings, /Customer privacy|Privacy/i);
    // 11. Brand and media
    assert.match(settings, /Brand|Logo/i);
  });

  it('keeps Billing, Domains, and Policies under Settings in Admin V3 navigation', () => {
    assert.match(nav, /label: 'Settings', to: '\/admin\/settings'/);
    assert.doesNotMatch(nav, /label: 'Billing', to:/);
    assert.doesNotMatch(nav, /label: 'Marketing', to:/);
    assert.match(nav, /label: 'Store'[\s\S]*label: 'Store Builder'[\s\S]*label: 'Themes'/);
  });

  it('preserves backward-compatible routing and supported sub-routes in App.tsx', () => {
    // Canonical Settings routes
    assert.match(app, /path=["']settings["'] element={<Settings \/>}/);
    assert.match(app, /path=["']settings\/billing["'] element={<Billing \/>}/);
    assert.match(app, /path=["']settings\/shipping["'] element={<AdminShipping \/>}/);
    assert.match(app, /path=["']settings\/domains["'] element={<StoreDomains \/>}/);
    assert.match(app, /path=["']settings\/policies["'] element={<StorePolicies \/>}/);

    // Backward-compatible legacy bookmarks
    assert.match(app, /path=["']billing["'] element={<Billing \/>}/);
    assert.match(app, /path=["']shipping["'] element={<AdminShipping \/>}/);
    assert.match(app, /path=["']store\/domains["'] element={<StoreDomains \/>}/);
    assert.match(app, /path=["']store\/policies["'] element={<StorePolicies \/>}/);
    assert.match(app, /path=["']store\/navigation["'] element={<StoreNavigation \/>}/);
  });

  it('uses Charcoal + Mint design tokens and English-only copy across all settings surfaces', () => {
    for (const [name, source] of [
      ['Settings', settings],
      ['Domains', storeDomains],
      ['Policies', storePolicies],
      ['Navigation', storeNavigation],
      ['Shipping', shipping],
    ] as const) {
      assert.doesNotMatch(source, /text-violet-/i, `${name} should not contain violet tokens`);
      assert.doesNotMatch(source, /bg-violet-/i, `${name} should not contain violet tokens`);
      assert.doesNotMatch(source, /text-indigo-/i, `${name} should not contain indigo tokens`);
    }

    // Shipping page should be English-first in Admin V3
    assert.match(shipping, /Shipping Zones/i);
    assert.match(shipping, /Add Zone/i);
  });

  it('keeps placeholders truthful without fake save controls or mock configurations', () => {
    for (const [name, source] of [
      ['Navigation', storeNavigation],
      ['Domains', storeDomains],
      ['Policies', storePolicies],
    ] as const) {
      assert.match(source, new RegExp(name));
      assert.match(source, /(not available yet|not configured yet|preserved|read-only)/i);
      assert.doesNotMatch(source, /onClick=|<form|<input|<button/);
    }
  });

  it('keeps informational settings pages truthful about unsupported management actions', () => {
    assert.match(settingsPayments, /Current payment capabilities/i);
    assert.doesNotMatch(settingsPayments, />\s*Enabled\s*</i);
    assert.match(settingsUsers, /Multi-staff management is not available yet/i);
  });

  it('preserves store profile mutation contract with tenant RLS isolation and file validation', () => {
    assert.match(settings, /updateOwnShop/);
    assert.match(settings, /validateImageFile/);
    assert.match(settings, /prepareImageForUpload/);
    assert.match(settings, /adminApi\.uploadShopLogo/);
    assert.match(settings, /adminApi\.deleteShopLogo/);
    assert.doesNotMatch(settings, /service_role|serviceKey/);
  });
});
