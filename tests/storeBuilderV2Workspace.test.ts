import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);

describe('Store Builder V2 workspace contract', () => {
  it('provides an English-first full-screen editor toolbar', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    for (const label of ['Back', 'Publish', 'Desktop', 'Mobile', 'Pages', 'AI Store Builder']) {
      assert.match(source, new RegExp(label.replace(/[&]/g, '\\&')));
    }
    assert.match(source, /data-store-builder="ai-chat-preview"/);
    assert.match(source, /data-editor-fullscreen/);
    assert.doesNotMatch(source, /AdminLayout|AdminNav|AdminMobileNav/);
  });

  it('wires AI proposals to validated draft updates and live preview', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /validateAndExecuteAiCommands/);
    assert.match(source, /onApplyProposal={handleApplyProposal}/);
    assert.match(source, /updateDocument\(result.doc\)/);
    assert.match(source, /<PreviewCanvas/);
  });

  it('keeps lifecycle persistence and publish actions behind the existing interfaces', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /persistEditorState/);
    assert.match(source, /publishSavedDraft/);
    assert.match(source, /expectedRevision/);
    assert.match(source, /expectedDraftRevision/);
  });
});
