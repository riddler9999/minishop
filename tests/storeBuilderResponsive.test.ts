import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);
const panelsPath = new URL('../src/features/shop/storeBuilder/MobileEditorPanels.tsx', import.meta.url);

describe('Store Builder #115 mobile editor contract', () => {
  it('uses a preview-first single-column mobile layout and desktop three-pane layout', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /lg:grid-cols-\[240px_minmax\(0,1fr\)_280px\]/);
    assert.match(source, /order-first|data-mobile-preview-first/);
    assert.match(source, /max-w-full|min-w-0/);
  });

  it('provides section drawer and inspector bottom sheet controls', () => {
    const shell = fs.readFileSync(shellPath, 'utf8');
    const panels = fs.readFileSync(panelsPath, 'utf8');
    assert.match(shell, /mobilePanel/);
    assert.match(shell, /MobileEditorPanels/);
    assert.match(panels, /data-mobile-section-drawer/);
    assert.match(panels, /data-mobile-inspector-sheet/);
    assert.match(panels, /role="dialog"/);
  });

  it('traps focus, closes on Escape, and restores trigger focus', () => {
    const panels = fs.readFileSync(panelsPath, 'utf8');
    assert.match(panels, /useModalA11y/);
    assert.match(panels, /onClose/);
    assert.match(panels, /aria-modal="true"/);
    assert.match(panels, /aria-label="ပိတ်မည်"/);
  });
});
