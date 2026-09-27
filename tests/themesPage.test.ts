import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const path = new URL('../src/features/shop/pages/Themes.tsx', import.meta.url);

describe('Store Builder #112 Themes entry screen', () => {
  it('has a dedicated Themes page', () => {
    assert.equal(fs.existsSync(path), true, 'Themes page must exist');
  });

  it('presents Published theme, Customize action, and alternate Draft switching', () => {
    const source = fs.readFileSync(path, 'utf8');
    assert.match(source, /Published/i);
    assert.match(source, /Customize/i);
    assert.match(source, /createThemeDraft/);
    assert.match(source, /draftRevision|saveDraft/i);
  });
});
