import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';
import {appendAssistantProposal, createInitialConversation, getProposalPresentation, setProposalApplicationStatus} from '../src/domain/aiConversation.ts';
import {validateAndExecuteAiCommands} from '../src/domain/storeDesign/aiCommands.ts';
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

  it('never mutates a blocked editor during local Undo/Redo attempts', () => {
    const initial = createDefaultStoreDesign();
    const conflict = {...createEditorState(initial, 2), blocked: true, status: 'conflict' as const};
    const proposed = {...initial, globalSettings: {...initial.globalSettings, accentColor: '#123456'}};
    const next = applyLocalEdit(conflict, proposed);
    assert.strictEqual(next.document, initial, 'blocked editor must retain the original document');
    assert.strictEqual(next, conflict, 'blocked editor state must not change');
  });

  it('guards Undo and Redo against the latest conflict, not a stale render closure', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.ok(source.includes('const editorRef = useRef(editor)'));
    assert.ok(source.includes('const reconciled = reconcileSaveResult(editorRef.current'));
    assert.ok(source.includes('editorRef.current = reconciled'));
    assert.ok(source.includes('const handleUndo = () => {\n    if (editorRef.current.blocked) return;'));
    assert.ok(source.includes('const handleRedo = () => {\n    if (editorRef.current.blocked) return;'));
    assert.ok(source.includes('canUndo={!editor.blocked && history.past.length > 0}'));
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


describe('AI proposal application status regression', () => {
  const proposal = {
    id: 'proposal-1',
    userPrompt: 'change color',
    summary: 'Change color',
    commands: [{type: 'set_global_settings' as const, patch: {accentColor: '#123456'}}],
    createdAt: '2026-10-10T00:00:00Z',
    baseRevision: 'original-revision',
  };

  function message() {
    return appendAssistantProposal(createInitialConversation('shop'), proposal).assistantMsg;
  }

  it('shows pending until a matching local change has actually been persisted', () => {
    const original = message();
    assert.equal(getProposalPresentation(original, 'revision-1', 'saved').label, 'Pending Application');

    const applied = setProposalApplicationStatus(
      appendAssistantProposal(createInitialConversation('shop'), proposal).conversation,
      proposal.id,
      'applied',
      {revision: 'revision-2'},
    ).messages.at(-1)!;
    for (const saveStatus of ['dirty', 'saving'] as const) {
      const presentation = getProposalPresentation(applied, 'revision-2', saveStatus);
      assert.notEqual(presentation.kind, 'success');
    }
    assert.equal(getProposalPresentation(applied, 'revision-2', 'saved').kind, 'success');
    assert.equal(getProposalPresentation(applied, 'revision-2', 'saved').label, 'Saved to Draft');
  });

  it('does not claim success after retry, conflict, or a newer Undo/Redo revision', () => {
    const updated = setProposalApplicationStatus(
      appendAssistantProposal(createInitialConversation('shop'), proposal).conversation,
      proposal.id, 'applied', {revision: 'revision-2'},
    ).messages.at(-1)!;
    assert.notEqual(getProposalPresentation(updated, 'revision-2', 'retry').kind, 'success');
    assert.notEqual(getProposalPresentation(updated, 'revision-2', 'conflict').kind, 'success');
    assert.equal(getProposalPresentation(updated, 'undo-revision', 'saved').kind, 'superseded');
    assert.equal(getProposalPresentation(updated, 'redo-revision', 'saved').kind, 'superseded');
  });

  it('keeps a rejected AI command out of the document and reports its rejection', () => {
    const initial = createDefaultStoreDesign();
    const rejected = validateAndExecuteAiCommands(initial, [
      {type: 'set_global_settings', patch: {accentColor: 'not-a-color'}},
    ]);
    assert.equal(rejected.ok, false);
    assert.deepEqual(rejected.doc, initial);
    const failed = setProposalApplicationStatus(
      appendAssistantProposal(createInitialConversation('shop'), proposal).conversation,
      proposal.id, 'failed', {error: rejected.errors[0].message},
    ).messages.at(-1)!;
    const presentation = getProposalPresentation(failed, 'revision-1', 'saved');
    assert.equal(presentation.kind, 'failed');
    assert.match(presentation.detail, /Invalid accent color/);
  });

  it('requires confirmation before applying a destructive proposal', () => {
    const destructive = {...message(), proposal: {...proposal, isDestructive: true}};
    const presentation = getProposalPresentation(destructive, 'original-revision', 'saved');
    assert.equal(presentation.kind, 'confirmation');
  });
});
