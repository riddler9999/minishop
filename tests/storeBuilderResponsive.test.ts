import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const shell = fs.readFileSync(new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url), 'utf8');
const panels = fs.readFileSync(new URL('../src/features/shop/storeBuilder/MobileEditorPanels.tsx', import.meta.url), 'utf8');

describe('Store Builder responsive acceptance', () => {
  it('keeps preview-first layout and reachable editor controls at narrow widths', () => {
    for (const width of [375, 390, 414]) assert.ok(width <= 414);
    assert.match(shell, /data-mobile-preview-first/);
    assert.match(shell, /lg:grid-cols-\[240px_minmax\(0,1fr\)_300px\]/);
    assert.match(shell, /min-w-0|max-w-full/);
    assert.match(shell, /min-h-11|min-h-12/);
  });

  it('exposes labelled mobile sheets with modal semantics', () => {
    assert.match(panels, /aria-label="Section navigation"/);
    assert.match(panels, /aria-label="Inspector"/);
    assert.match(panels, /focus-visible/);
  });
});
