import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';

describe('AI Store Builder recovery and revision binding', () => {
  it('binds proposals to the draft revision and rejects stale apply', async () => {
    const shell = await readFile('src/features/shop/storeBuilder/StoreBuilderShell.tsx', 'utf8');
    const api = await readFile('api/ai.ts', 'utf8');
    assert.match(shell, /baseRevision = editorRevision\.current/);
    assert.match(shell, /proposal\.baseRevision !== editorRevision\.current/);
    assert.match(api, /baseRevision: body\.baseRevision/);
  });

  it('preserves prompt and attachments when provider execution fails', async () => {
    const panel = await readFile('src/features/shop/storeBuilder/AiChatPanel.tsx', 'utf8');
    const request = panel.slice(panel.indexOf('async function handleSubmit'), panel.indexOf('function handleApplyClick'));
    assert.ok(request.indexOf('await onSendMessage') < request.indexOf("setInputPrompt('')"));
    assert.ok(request.indexOf('await onSendMessage') < request.indexOf('setAttachedMedia([])'));
  });
});
