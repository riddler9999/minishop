import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const gatewayPath = new URL('../api/storefront.ts', import.meta.url);

describe('Published-only buyer Store Design read path', () => {
  it('reads Published through the dedicated buyer RPC and never exposes Draft or Previous Published', async () => {
    const source = await readFile(gatewayPath, 'utf8');

    assert.match(source, /load_published_store_design/);
    assert.doesNotMatch(source, /draft_document/);
    assert.doesNotMatch(source, /previous_published_document/);
  });

  it('keeps active-shop tenant lookup before resolving Store Design', async () => {
    const source = await readFile(gatewayPath, 'utf8');
    const activeShopLookup = source.indexOf(".eq('is_active', true)");
    const publishedLookup = source.indexOf('load_published_store_design');

    assert.ok(activeShopLookup >= 0);
    assert.ok(publishedLookup > activeShopLookup);
  });

  it('keeps transitional legacy shops.theme fallback when no lifecycle document is returned', async () => {
    const source = await readFile(gatewayPath, 'utf8');

    assert.match(source, /select\('theme'\)/);
    assert.match(source, /published.*theme|theme.*published/is);
  });
});
