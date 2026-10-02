import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const settings = fs.readFileSync(new URL('../src/features/shop/pages/Settings.tsx', import.meta.url), 'utf8');
const billing = fs.readFileSync(new URL('../src/features/billing/pages/Billing.tsx', import.meta.url), 'utf8');
const themes = fs.readFileSync(new URL('../src/features/shop/pages/Themes.tsx', import.meta.url), 'utf8');
const storeNavigation = fs.readFileSync(new URL('../src/features/shop/pages/StoreNavigation.tsx', import.meta.url), 'utf8');
const storeDomains = fs.readFileSync(new URL('../src/features/shop/pages/StoreDomains.tsx', import.meta.url), 'utf8');
const storePolicies = fs.readFileSync(new URL('../src/features/shop/pages/StorePolicies.tsx', import.meta.url), 'utf8');

describe('Admin V2 store/settings/billing IA', () => {
  it('routes Store Navigation, Domains, and Policies inside RequireAdmin', () => {
    assert.match(app, /path=["']store\/navigation["'] element={<StoreNavigation \/>}/);
    assert.match(app, /path=["']store\/domains["'] element={<StoreDomains \/>}/);
    assert.match(app, /path=["']store\/policies["'] element={<StorePolicies \/>}/);
  });

  it('keeps Billing separated from Store and Settings in primary navigation', () => {
    assert.match(nav, /label: 'Settings', to: '\/admin\/settings'/);
    assert.match(nav, /label: 'Billing', to: '\/admin\/billing'/);
    assert.match(nav, /label: 'Store',[\s\S]*label: 'Store Builder'[\s\S]*label: 'Navigation'[\s\S]*label: 'Domains'[\s\S]*label: 'Policies'/);
  });

  it('uses English-first headings on Settings, Billing, and Themes', () => {
    assert.match(settings, /\/>\s*Settings\s*<PlanBadge/);
    assert.match(billing, />Billing</);
    assert.match(themes, />Themes</);
  });

  it('preserves the Store Design lifecycle entry and explicit publish semantics', () => {
    assert.match(themes, /\/admin\/online-store\/themes\/customize/);
    assert.match(themes, /Draft/);
    assert.match(themes, /Publish/);
  });

  it('does not fake unavailable Navigation, Domains, or Policies controls', () => {
    for (const [name, source] of [['Navigation', storeNavigation], ['Domains', storeDomains], ['Policies', storePolicies]] as const) {
      assert.match(source, new RegExp(name));
      assert.match(source, /(not available yet|not configured yet|coming in a future update|setup is not available yet)/i);
      assert.doesNotMatch(source, /onClick=|<form|<input|<button/);
    }
  });
});
