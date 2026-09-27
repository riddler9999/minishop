import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import fs from 'node:fs';

const path = new URL('../src/features/shop/pages/Themes.tsx', import.meta.url);
const source = fs.readFileSync(path, 'utf8');
const buyerApi = fs.readFileSync(new URL('../src/features/catalog/api/storeDesign.ts', import.meta.url), 'utf8');

describe('Store Builder #112 Themes entry screen', () => {
  it('has a dedicated localized Themes page with Published and Customize semantics', () => {
    assert.match(source, /လက်ရှိအသုံးပြုနေသည်/);
    assert.match(source, /ပြင်ဆင်မည်/);
    assert.match(source, /online-store\/themes\/customize/);
  });

  it('creates and persists a theme switch as Draft using optimistic concurrency', () => {
    assert.match(source, /createThemeDraft\(lifecycle\.draft, targetThemeId\)/);
    assert.match(source, /expectedRevision\s*=\s*lifecycle\.draftRevision/);
    assert.match(source, /adminApi\.saveDraft\(\{expectedRevision, document\}\)/);
    assert.doesNotMatch(source, /publishDraft\(/);
  });

  it('keeps Published separate from Draft after a theme save', () => {
    assert.match(source, /draft:\s*saved\.document/);
    assert.match(source, /draftRevision:\s*saved\.revision/);
    const saveBlock = source.slice(
      source.indexOf('const saved = await adminApi.saveDraft'),
      source.indexOf("setStatus({kind: 'saved'"),
    );
    assert.doesNotMatch(saveBlock, /published:/);
  });

  it('preserves the Published-only buyer read boundary from #108', () => {
    assert.match(buyerApi, /loadPublishedStoreDesign/);
    assert.doesNotMatch(buyerApi, /draft_document|previous_published_document|loadOwnStoreDesign|saveDraft|publishDraft/);
  });
});
