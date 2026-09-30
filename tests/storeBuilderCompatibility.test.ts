import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {loadBuyerStoreDesign} from '../api/_storefront-design.ts';

type RpcResult = {data: any; error: any};
type LegacyResult = {data: any; error: any};

function client(rpcResult: RpcResult, legacyResult: LegacyResult) {
  let legacyReads = 0;
  return {
    get legacyReads() { return legacyReads; },
    api: {
      async rpc() { return rpcResult; },
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    legacyReads += 1;
                    return legacyResult;
                  },
                };
              },
            };
          },
        };
      },
    },
  };
}

describe('Store Builder #116 buyer compatibility cutover', () => {
  it('prefers lifecycle Published and does not read legacy theme when lifecycle exists', async () => {
    const fake = client(
      {data: {document: {schemaVersion: 1, themeId: 'clean-minimal'}}, error: null},
      {data: {theme: {presetId: 'soft-elegant'}}, error: null},
    );

    const result = await loadBuyerStoreDesign(fake.api, {shopId: 'shop-1', shopSlug: 'seller'});

    assert.deepEqual(result, {ok: true, document: {schemaVersion: 1, themeId: 'clean-minimal'}});
    assert.equal(fake.legacyReads, 0);
  });

  it('falls back to legacy shops.theme while the lifecycle RPC is not deployed yet', async () => {
    const fake = client(
      {data: null, error: {code: 'PGRST202', message: 'Could not find the function public.load_published_store_design'}},
      {data: {theme: {presetId: 'soft-elegant'}}, error: null},
    );

    const result = await loadBuyerStoreDesign(fake.api, {shopId: 'shop-1', shopSlug: 'seller'});

    assert.deepEqual(result, {ok: true, document: {presetId: 'soft-elegant'}});
    assert.equal(fake.legacyReads, 1);
  });

  it('fails closed on lifecycle RPC errors other than an undeployed function', async () => {
    const fake = client(
      {data: null, error: {code: '42501', message: 'permission denied'}},
      {data: {theme: {presetId: 'soft-elegant'}}, error: null},
    );

    const result = await loadBuyerStoreDesign(fake.api, {shopId: 'shop-1', shopSlug: 'seller'});

    assert.deepEqual(result, {ok: false});
    assert.equal(fake.legacyReads, 0);
  });

  it('falls back to legacy theme when the lifecycle RPC exists but no lifecycle row exists', async () => {
    const fake = client(
      {data: null, error: null},
      {data: {theme: {presetId: 'soft-elegant'}}, error: null},
    );

    const result = await loadBuyerStoreDesign(fake.api, {shopId: 'shop-1', shopSlug: 'seller'});

    assert.deepEqual(result, {ok: true, document: {presetId: 'soft-elegant'}});
    assert.equal(fake.legacyReads, 1);
  });
});
