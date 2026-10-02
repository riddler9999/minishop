import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const shellPath = new URL('../src/features/shop/storeBuilder/StoreBuilderShell.tsx', import.meta.url);

describe('Store Builder V2 workspace contract', () => {
  it('provides an English-first full-screen editor toolbar', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    for (const label of ['Back', 'Preview', 'Publish', 'Desktop', 'Mobile', 'Pages & Sections', 'Inspector']) {
      assert.match(source, new RegExp(label.replace(/[&]/g, '\\&')));
    }
    assert.match(source, /data-store-builder="three-pane"/);
    assert.match(source, /data-editor-fullscreen/);
    assert.doesNotMatch(source, /AdminLayout|AdminNav|AdminMobileNav/);
  });

  it('keeps one selection state wired to tree, canvas, and inspector', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /selectedSectionId/);
    assert.match(source, /<SectionTree[\\s\\S]*onSelect={selectSection}/);
    assert.match(source, /<PreviewCanvas[\\s\\S]*selectedSectionId={selectedSectionId}/);
    assert.match(source, /<Inspector section={selected}/);
  });

  it('keeps lifecycle persistence and publish actions behind the existing interfaces', () => {
    const source = fs.readFileSync(shellPath, 'utf8');
    assert.match(source, /persistEditorState/);
    assert.match(source, /publishSavedDraft/);
    assert.match(source, /expectedRevision/);
    assert.match(source, /expectedDraftRevision/);
  });
});
