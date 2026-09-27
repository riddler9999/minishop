import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const gatewayUrl = new URL('../api/storefront.ts', import.meta.url);
const adapterUrl = new URL('../src/features/catalog/api/storeDesign.ts', import.meta.url);
const liveApiUrl = new URL('../src/data/liveApi.ts', import.meta.url);

describe('Published-only Store Design buyer path', () => {
  it('exposes a catalog adapter that normalizes the returned public document', async () => {
    const source = await readFile(adapterUrl, 'utf8');
    assert.match(source, /normalizeStoreDesign/);
    assert.match(source, /loadPublishedStoreDesign/);
    assert.match(source, /action:\s*['"]store-design['"]/);
  });

  it('gateway reads the Published-only RPC and never selects lifecycle private slots', async () => {
    const source = await readFile(gatewayUrl, 'utf8');
    assert.match(source, /action\s*===\s*['"]store-design['"]/);
    assert.match(source, /rpc\(['"]load_published_store_design['"]/);
    assert.doesNotMatch(source, /from\(['"]store_designs['"]\).*select\([^)]*(draft_document|previous_published_document)/s);
  });

  it('falls back to the already-resolved active shop legacy theme only when lifecycle data is absent', async () => {
    const source = await readFile(gatewayUrl, 'utf8');
    assert.match(source, /load_published_store_design/);
    assert.match(source, /if\s*\([^)]*(?:published|design)[^)]*\)/i);
    assert.match(source, /from\(['"]shops['"]\)\.select\(['"]theme['"]\)\.eq\(['"]id['"],\s*shop\.id\)/);
  });

  it('composes the Published Store Design adapter into the buyer-facing live API', async () => {
    const source = await readFile(liveApiUrl, 'utf8');
    assert.match(source, /catalogStoreDesignApi/);
    assert.match(source, /\.\.\.catalogStoreDesignApi/);
  });
});
