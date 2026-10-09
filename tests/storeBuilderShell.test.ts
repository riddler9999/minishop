import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import {
  applyLocalEdit,
  createEditorState,
  persistEditorState,
  publishSavedDraft,
  reconcileSaveResult,
} from '../src/features/shop/storeBuilder/editorState.ts';

const statePath = new URL('../src/features/shop/storeBuilder/editorState.ts', import.meta.url);
const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);
const previewPath = new URL('../src/features/shop/storeBuilder/PreviewCanvas.tsx', import.meta.url);
const lifecyclePath = new URL('../src/features/shop/pages/LifecycleStoreBuilder.tsx', import.meta.url);
const legacyDesignPath = new URL('../src/features/shop/pages/StoreDesign.tsx', import.meta.url);
const appPath = new URL('../src/app/App.tsx', import.meta.url);

describe('Store Builder #113 desktop shell and autosave contract', () => {
  it('keeps a newer local edit after an older save resolves', async () => {
    const initial = createDefaultStoreDesign();
    const savingSnapshot = applyLocalEdit(createEditorState(initial, 4), {
      ...initial,
      globalSettings: {...initial.globalSettings, accentColor: '#111111'},
    });
    const newerLocal = applyLocalEdit({...savingSnapshot, status: 'saving'}, {
      ...savingSnapshot.document,
      globalSettings: {...savingSnapshot.document.globalSettings, accentColor: '#222222'},
    });
    const saved = await persistEditorState(savingSnapshot, async ({document}) => ({
      revision: 5,
      document,
    }));
    const reconciled = reconcileSaveResult(newerLocal, savingSnapshot, saved);

    assert.equal(reconciled.document.globalSettings.accentColor, '#222222');
    assert.equal(reconciled.expectedRevision, 5);
    assert.equal(reconciled.status, 'dirty');
  });

  it('blocks silent overwrite after a stale revision conflict', async () => {
    const initial = createDefaultStoreDesign();
    const dirty = applyLocalEdit(createEditorState(initial, 2), initial);
    const conflict = await persistEditorState(dirty, async () => {
      const error = new Error('conflict') as Error & {code: string};
      error.code = 'STORE_DESIGN_CONFLICT';
      throw error;
    });

    assert.equal(conflict.status, 'conflict');
    assert.equal(conflict.blocked, true);
  });

  it('publishes only the latest successfully saved draft revision', async () => {
    const initial = createDefaultStoreDesign();
    const state = createEditorState(initial, 7);
    let publishedRevision = 0;
    await publishSavedDraft(state, async ({expectedDraftRevision}) => {
      publishedRevision = expectedDraftRevision;
      return {};
    });
    assert.equal(publishedRevision, 7);

    await assert.rejects(
      () => publishSavedDraft({...state, status: 'dirty'}, async () => ({})),
      /Save the latest Draft/,
    );
  });

  it('defines explicit autosave states and debounced save intent', () => {
    const source = fs.readFileSync(statePath, 'utf8');
    for (const state of ['saving', 'saved', 'retry', 'conflict']) assert.match(source, new RegExp(state));
    assert.match(source, /debounce|debounced|SAVE_DELAY/i);
    assert.match(source, /expectedRevision/);
  });

  it('renders AI chat and live preview with Retry and Conflict recovery controls', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /AiChatPanel/);
    assert.match(source, /PreviewCanvas/);
    assert.match(source, /data-store-builder="ai-chat-preview"/);
    assert.match(source, /Retry/);
    assert.match(source, /Reload/);
    assert.match(source, /publishSavedDraft/);
  });

  it('uses the shared storefront renderer in preview and thins the legacy preview to the same renderer', () => {
    const preview = fs.readFileSync(previewPath, 'utf8');
    const legacyPreview = fs.readFileSync(new URL('../src/features/shop/components/StorePreview.tsx', import.meta.url), 'utf8');
    assert.match(preview, /StorefrontRenderer|buildStorefrontRenderPlan|shared/i);
    assert.doesNotMatch(preview, /StorePreview/);
    assert.match(legacyPreview, /StorefrontRenderer/);
    assert.doesNotMatch(legacyPreview, /function HomePreview|function CategoryPreview|function ProductPreview/);
  });

  it('routes lifecycle Customize through the new Store Builder shell while keeping legacy design shape isolated', () => {
    const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
    const legacyDesign = fs.readFileSync(legacyDesignPath, 'utf8');
    const app = fs.readFileSync(appPath, 'utf8');
    assert.match(lifecycle, /StoreBuilderShell/);
    assert.match(lifecycle, /loadOwnStoreDesign/);
    assert.match(app, /online-store\/themes\/customize["'] element={<LifecycleStoreBuilder \/>}/);
    assert.match(app, /path=["']design["'] element={<StoreDesign \/>}/);
    assert.doesNotMatch(legacyDesign, /loadOwnStoreDesign|saveDraft|as unknown as StorefrontTheme|lifecycleMode/);
  });
});
