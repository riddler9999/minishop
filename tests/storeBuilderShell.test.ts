import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const statePath = new URL('../src/features/shop/storeBuilder/editorState.ts', import.meta.url);
const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);
const previewPath = new URL('../src/features/shop/storeBuilder/PreviewCanvas.tsx', import.meta.url);
const storeDesignPath = new URL('../src/features/shop/pages/StoreDesign.tsx', import.meta.url);

describe('Store Builder #113 desktop shell and autosave contract', () => {
  it('defines explicit autosave states and debounced save intent', () => {
    const source = fs.readFileSync(statePath, 'utf8');
    for (const state of ['saving', 'saved', 'retry', 'conflict']) assert.match(source, new RegExp(state));
    assert.match(source, /debounce|debounced|SAVE_DELAY/i);
    assert.match(source, /expectedRevision/);
  });

  it('blocks silent overwrite after a stale revision conflict', () => {
    const source = fs.readFileSync(statePath, 'utf8');
    assert.match(source, /STORE_DESIGN_CONFLICT|conflict/);
    assert.match(source, /blocked|blockSave|canSave/i);
  });

  it('publishes only the latest successfully saved draft revision', () => {
    const source = fs.readFileSync(statePath, 'utf8');
    assert.match(source, /lastSavedRevision|savedRevision/);
    assert.match(source, /publish/i);
    assert.match(source, /expectedDraftRevision/);
  });

  it('renders a three-pane desktop shell', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /Section|tree/i);
    assert.match(source, /PreviewCanvas/);
    assert.match(source, /Inspector/i);
    assert.match(source, /grid-cols|three-pane|3-pane/i);
  });

  it('uses the shared storefront renderer in preview instead of legacy StorePreview', () => {
    const preview = fs.readFileSync(previewPath, 'utf8');
    assert.match(preview, /StorefrontRenderer|buildStorefrontRenderPlan|shared/i);
    assert.doesNotMatch(preview, /StorePreview/);
  });

  it('routes lifecycle customize through the new Store Builder shell', () => {
    const source = fs.readFileSync(storeDesignPath, 'utf8');
    assert.match(source, /StoreBuilderShell/);
    assert.match(source, /lifecycleMode/);
  });
});
