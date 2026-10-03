import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../src/features/admin/components/AdminLayout.tsx', import.meta.url), 'utf8');
const mobile = fs.readFileSync(new URL('../src/features/admin/components/AdminMobileNav.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/features/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const consoleShell = fs.readFileSync(new URL('../src/app/routes/AdminConsole.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/app/App.tsx', import.meta.url), 'utf8');

describe('Admin V2 shell', () => {
  it('uses one canonical reusable admin navigation', () => {
    assert.match(layout, /import AdminNav from ['"]\.\/AdminNav['"]/);
    assert.match(layout, /<AdminNav \/>/);
    assert.match(mobile, /import AdminNav from ['"]\.\/AdminNav['"]/);
    assert.match(mobile, /<AdminNav onNavigate=\{onClose\} \/>/);
    assert.doesNotMatch(layout, /const NAV\s*=/);
    assert.match(nav, /export const ADMIN_NAV_ITEMS/);
  });

  it('provides accessible mobile open and close controls', () => {
    assert.match(layout, /aria-label="Open navigation"/);
    assert.match(layout, /aria-expanded=\{mobileOpen\}/);
    assert.match(mobile, /role="dialog"/);
    assert.match(mobile, /aria-modal="true"/);
    assert.match(mobile, /aria-label="Admin navigation"/);
    assert.match(mobile, /aria-label="Close navigation"/);
    assert.match(mobile, /useModalA11y/);
  });

  it('keeps a persistent dark desktop sidebar and light workspace without document overflow', () => {
    assert.match(layout, /bg-\[var\(--admin-sidebar\)\]/);
    assert.match(layout, /className="admin-shell/);
    assert.match(layout, /bg-\[var\(--admin-canvas\)\]/);
    assert.match(layout, /overflow-x-hidden/);
    assert.match(layout, /lg:pl-64/);
  });

  it('uses only the shared mobile drawer and no admin bottom tabs', () => {
    assert.match(layout, /<AdminMobileNav open=\{mobileOpen\}/);
    assert.doesNotMatch(layout, /AdminBottomNav|bottom-tabs/);
    assert.match(layout, /min-h-11/);
    assert.match(mobile, /useModalA11y/);
    assert.doesNotMatch(dashboard, /pb-24/);
    assert.match(dashboard, /pb-8/);
  });

  it('uses a slide-out transition and accessible trigger for the mobile drawer', () => {
    assert.match(layout, /aria-label="Open navigation"/);
    assert.match(layout, /aria-expanded=\{mobileOpen\}/);
    assert.match(layout, /aria-controls="admin-mobile-nav"/);
    assert.match(layout, /<Menu className="h-5 w-5" \/>/);
    assert.match(mobile, /id="admin-mobile-nav"/);
    assert.match(mobile, /transition-transform/);
    assert.match(mobile, /translate-x-0/);
    assert.match(mobile, /-translate-x-full/);
    assert.match(mobile, /motion-reduce:transition-none/);
  });

  it('preserves AdminConsole nesting and RequireAdmin security boundary', () => {
    assert.match(consoleShell, /return <AdminLayout \/>/);
    assert.match(app, /path="\/admin"/);
    assert.match(app, /<RequireAdmin>[\s\S]*<AdminConsole \/>[\s\S]*<\/RequireAdmin>/);
  });

  it('keeps Store Builder outside the normal admin chrome', () => {
    assert.match(layout, /pathname === '\/admin\/online-store\/themes\/customize'/);
    assert.match(layout, /if \(inStoreBuilder\)/);
  });
});
