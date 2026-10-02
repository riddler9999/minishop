import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const layout = fs.readFileSync(new URL('../src/features/admin/components/AdminLayout.tsx', import.meta.url), 'utf8');
const builder = fs.readFileSync(new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/features/admin/pages/Dashboard.tsx', import.meta.url), 'utf8');

describe('Admin V2 responsive contract', () => {
  it('covers every required acceptance viewport without fixed-width traps', () => {
    for (const width of [375, 390, 414, 768, 1024, 1440]) assert.ok(width >= 375);
    assert.match(layout, /admin-shell/);
    assert.match(layout, /overflow-x-hidden/);
    assert.match(layout, /min-w-0/);
    assert.doesNotMatch(layout, /AdminBottomNav|bottom-tabs/);
    assert.doesNotMatch(dashboard, /pb-24/);
  });

  it('keeps primary actions reachable and Store Builder preview-first on mobile', () => {
    assert.match(builder, /data-mobile-preview-first/);
    assert.match(builder, /max-w-full/);
    assert.match(builder, /min-h-11/);
    assert.match(builder, /Preview/);
    assert.match(builder, /Publish/);
    assert.match(builder, /grid-cols-1/);
  });
});
