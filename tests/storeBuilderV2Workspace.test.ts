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

  it('auto-applies validated safe proposals and keeps destructive changes behind confirmation', () => {
    const shell = fs.readFileSync(shellPath, 'utf8');
    const chat = fs.readFileSync(new URL('../src/features/shop/storeBuilder/AiChatPanel.tsx', import.meta.url), 'utf8');
    const gateway = fs.readFileSync(new URL('../api/ai.ts', import.meta.url), 'utf8');
    assert.match(shell, /if \(!proposal\.isDestructive\) \{/);
    assert.match(shell, /if \(baseRevision !== documentRevision\.current\)/);
    assert.match(shell, /validateAndExecuteAiCommands\(editor\.document, proposal\.commands/);
    assert.match(shell, /updateDocument\(result\.doc\)/);
    // Status must be derived from successful persistence, not proposal presence.
    assert.match(chat, /getProposalPresentation/);
    assert.match(chat, /proposalStatus\?\.kind === 'success'/);
    assert.match(chat, /currentRevision/);
    assert.match(chat, /saveStatus/);
    assert.match(chat, /Review &amp; Apply/);
    assert.match(chat, /Confirm &amp; Apply/);
    assert.match(gateway, /command\.type === 'remove_section'/);
    assert.match(gateway, /command\.type === 'set_section_enabled' && command\.enabled === false/);
  });

  it('keeps lifecycle persistence and publish actions behind the existing interfaces', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /persistEditorState/);
    assert.match(source, /publishSavedDraft/);
    assert.match(source, /expectedRevision/);
    assert.match(source, /expectedDraftRevision/);
  });
});
