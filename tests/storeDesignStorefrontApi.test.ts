import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {loadBuyerStoreDesign} from '../api/storefront-design.ts';
import {normalizeStoreDesign} from '../src/domain/storeDesign/index.ts';

function queryResult(value: unknown, error: unknown = null) {
  const chain: any = {
    select() { return chain; },
    eq() { return chain; },
    maybeSingle: async () => ({data: value, error}),
  };
  return chain;
}

function clientWith(opts: {
  published?: unknown;
  rpcError?: unknown;
  legacyTheme?: unknown;
}) {
  let themeReads = 0;
  const client: any = {
    from(table: string) {
      assert.equal(table, 'shops');
      themeReads += 1;
      return queryResult({theme: opts.legacyTheme ?? {presetId: 'clean-minimal'}});
    },
    rpc: async (name: string, args: unknown) => {
      assert.equal(name, 'load_published_store_design');
      assert.deepEqual(args, {p_shop_slug: 'demo-shop'});
      return {data: opts.published ?? null, error: opts.rpcError ?? null};
    },
  };
  return {client, themeReads: () => themeReads};
}

describe('Published-only Store Design buyer gateway', () => {
  it('returns only Published and does not touch legacy theme when lifecycle data exists', async () => {
    const published = normalizeStoreDesign({presetId: 'street-bold'});
    const {client, themeReads} = clientWith({published: {document: published}});

    const result = await loadBuyerStoreDesign(client, {shopId: 'shop-1', shopSlug: 'demo-shop'});

    assert.deepEqual(result, {ok: true, document: published});
    assert.equal(themeReads(), 0);
  });

  it('does not resurrect legacy theme when lifecycle exists with no Published document', async () => {
    const {client, themeReads} = clientWith({
      published: {document: null, revision: 0, published_at: null},
      legacyTheme: {presetId: 'street-bold'},
    });

    const result = await loadBuyerStoreDesign(client, {shopId: 'shop-1', shopSlug: 'demo-shop'});

    assert.deepEqual(result, {ok: true, document: null});
    assert.equal(themeReads(), 0);
  });

  it('falls back to legacy shops.theme only when the lifecycle row is absent', async () => {
    const legacy = {presetId: 'minimal', home: {heroHeadline: 'Legacy'}};
    const {client, themeReads} = clientWith({published: null, legacyTheme: legacy});

    const result = await loadBuyerStoreDesign(client, {shopId: 'shop-1', shopSlug: 'demo-shop'});

    assert.deepEqual(result, {ok: true, document: legacy});
    assert.equal(themeReads(), 1);
  });

  it('does not hide RPC failures behind the legacy fallback', async () => {
    const {client, themeReads} = clientWith({rpcError: {message: 'database unavailable'}});

    const result = await loadBuyerStoreDesign(client, {shopId: 'shop-1', shopSlug: 'demo-shop'});

    assert.deepEqual(result, {ok: false});
    assert.equal(themeReads(), 0);
  });
});
