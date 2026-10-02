import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../src/features/admin/components/AdminLayout.tsx', import.meta.url), 'utf8');
const nav = fs.readFileSync(new URL('../src/features/admin/components/AdminNav.tsx', import.meta.url), 'utf8');
const mobileNav = fs.readFileSync(new URL('../src/features/admin/components/AdminMobileNav.tsx', import.meta.url), 'utf8');
const badge = fs.readFileSync(new URL('../src/features/admin/components/AdminStatusBadge.tsx', import.meta.url), 'utf8');
const panels = fs.readFileSync(new URL('../src/features/shop/storeBuilder/MobileEditorPanels.tsx', import.meta.url), 'utf8');
const hook = fs.readFileSync(new URL('../src/shared/hooks/useModalA11y.ts', import.meta.url), 'utf8');

describe('Admin V2 accessibility contract', () => {
  it('labels navigation, uses visible focus styles, and exposes status semantically', () => {
    assert.match(layout, /aria-label="Open navigation"/);
    assert.match(nav, /aria-label="Admin navigation"/);
    assert.match(nav, /focus-visible/);
    assert.match(badge, /role="status"|aria-live/);
  });

  it('keeps mobile navigation and editor sheets keyboard-safe', () => {
    assert.match(mobileNav, /useModalA11y/);
    assert.match(mobileNav, /role="dialog"/);
    assert.match(mobileNav, /aria-modal="true"/);
    assert.match(panels, /role="dialog"/);
    assert.match(panels, /aria-modal="true"/);
    assert.match(hook, /Escape/);
    assert.match(hook, /previouslyFocused/);
  });
});
