import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createStorefrontHandler} from '../api/storefront.ts';
import {normalizeStoreDesign} from '../src/domain/storeDesign/index.ts';

function responseRecorder() {
  const state: {status?: number; body?: any} = {};
  const res: any = {
    statusCode: 200,
    setHeader() { return res; },
    status(code: number) { res.statusCode = code; return res; },
    send(body: unknown) { state.status = res.statusCode; state.body = body; return res; },
    end(body?: string) {
      state.status = res.statusCode;
      if (body !== undefined) {
        try { state.body = JSON.parse(body); } catch { state.body = body; }
      }
      return res;
    },
  };
  return {res, state};
}

function queryResult(value: unknown, error: unknown = null) {
  const chain: any = {
    select() { return chain; },
    eq() { return chain; },
    maybeSingle: async () => ({data: value, error}),
  };
  return chain;
}

function handlerWith(opts: {
  published?: unknown;
  rpcError?: unknown;
  legacyTheme?: unknown;
}) {
  let themeReads = 0;
  const shop = {id: 'shop-1', name: 'Demo', logo_url: null, default_delivery_fee: 0};
  const client: any = {
    from(table: string) {
      assert.equal(table, 'shops');
      return {
        select(columns: string) {
          if (columns === 'id,name,logo_url,default_delivery_fee') return queryResult(shop);
          if (columns === 'theme') {
            themeReads += 1;
            return queryResult({theme: opts.legacyTheme ?? {presetId: 'clean-minimal'}});
          }
          throw new Error(`unexpected select: ${columns}`);
        },
      };
    },
    rpc: async (name: string, args: unknown) => {
      assert.equal(name, 'load_published_store_design');
      assert.deepEqual(args, {p_shop_slug: 'demo-shop'});
      return {data: opts.published ?? null, error: opts.rpcError ?? null};
    },
  };

  const handler = createStorefrontHandler({
    env: () => ({url: 'https://example.supabase.co', key: 'anon'}),
    createClient: (() => client) as any,
  });
  return {handler, themeReads: () => themeReads};
}

describe('Published-only Store Design buyer gateway', () => {
  it('returns only the Published document and does not touch legacy theme when lifecycle data exists', async () => {
    const published = normalizeStoreDesign({presetId: 'street-bold'});
    const {handler, themeReads} = handlerWith({published: {document: published}});
    const {res, state} = responseRecorder();

    await handler({method: 'GET', query: {slug: 'demo-shop', action: 'store-design'}}, res);

    assert.equal(state.status, 200);
    assert.deepEqual(state.body, {document: published});
    assert.equal(themeReads(), 0);
  });

  it('falls back to legacy shops.theme only when the lifecycle row is absent', async () => {
    const legacy = {presetId: 'minimal', home: {heroHeadline: 'Legacy'}};
    const {handler, themeReads} = handlerWith({published: null, legacyTheme: legacy});
    const {res, state} = responseRecorder();

    await handler({method: 'GET', query: {slug: 'demo-shop', action: 'store-design'}}, res);

    assert.equal(state.status, 200);
    assert.deepEqual(state.body, {document: legacy});
    assert.equal(themeReads(), 1);
  });

  it('does not hide RPC failures behind the legacy fallback', async () => {
    const {handler, themeReads} = handlerWith({rpcError: {message: 'database unavailable'}});
    const {res, state} = responseRecorder();

    await handler({method: 'GET', query: {slug: 'demo-shop', action: 'store-design'}}, res);

    assert.equal(state.status, 502);
    assert.deepEqual(state.body, {error: 'Store design unavailable'});
    assert.equal(themeReads(), 0);
  });
});
