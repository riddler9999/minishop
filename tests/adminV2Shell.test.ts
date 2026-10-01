import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../src/features/admin/components/AdminLayout.tsx', import.meta.url), 'utf8');
const mobile = fs.readFileSync(new URL('../src/features/admin/components/AdminMobileNav.tsx', import.meta.url), 'utf8');
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
    assert.match(layout, /bg-slate-950/);
    assert.match(layout, /bg-slate-50/);
    assert.match(layout, /overflow-x-hidden/);
    assert.match(layout, /lg:pl-64/);
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
