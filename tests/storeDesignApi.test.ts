import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createDefaultStoreDesign} from '../src/domain/storeDesign/index.ts';
import {
  StoreDesignConflictError,
  createStoreDesignLifecycleAdapter,
} from '../src/features/shop/api/storeDesign.ts';

function rpcClient(handler: (fn: string, args?: Record<string, unknown>) => Promise<{data: unknown; error: unknown}>) {
  return {rpc: handler};
}

describe('seller Store Design lifecycle adapter', () => {
  it('loads and maps seller lifecycle without caller-provided shop id', async () => {
    const draft = createDefaultStoreDesign('clean-minimal');
    const published = createDefaultStoreDesign('soft-elegant');
    const calls: Array<{fn: string; args?: Record<string, unknown>}> = [];
    const adapter = createStoreDesignLifecycleAdapter(rpcClient(async (fn, args) => {
      calls.push({fn, args});
      return {
        data: {
          shop_id: 'server-owned-shop',
          draft_document: draft,
          published_document: published,
          previous_published_document: null,
          draft_revision: 7,
          published_revision: 3,
          updated_at: '2026-09-26T12:00:00Z',
          published_at: '2026-09-25T12:00:00Z',
        },
        error: null,
      };
    }));

    const lifecycle = await adapter.loadOwnStoreDesign();
    assert.equal(lifecycle.draftRevision, 7);
    assert.equal(lifecycle.publishedRevision, 3);
    assert.equal(lifecycle.draft.themeId, 'clean-minimal');
    assert.deepEqual(calls, [{fn: 'load_own_store_design', args: undefined}]);
  });

  it('saves Draft with expected revision and maps typed result', async () => {
    const document = createDefaultStoreDesign('dark-modern');
    const adapter = createStoreDesignLifecycleAdapter(rpcClient(async (fn, args) => {
      assert.equal(fn, 'save_store_design_draft');
      assert.equal(args?.p_expected_revision, 9);
      assert.deepEqual(args?.p_document, document);
      assert.equal('shop_id' in (args ?? {}), false);
      return {data: {revision: 10, document, updated_at: '2026-09-26T13:00:00Z'}, error: null};
    }));

    const result = await adapter.saveDraft({expectedRevision: 9, document});
    assert.equal(result.revision, 10);
    assert.equal(result.document.themeId, 'dark-modern');
  });

  it('maps stale revision rejection to StoreDesignConflictError', async () => {
    const document = createDefaultStoreDesign('clean-minimal');
    const adapter = createStoreDesignLifecycleAdapter(rpcClient(async () => ({
      data: null,
      error: {message: 'store_design_conflict', code: 'P0001'},
    })));

    await assert.rejects(
      adapter.saveDraft({expectedRevision: 2, document}),
      (error: unknown) => error instanceof StoreDesignConflictError,
    );
  });

  it('keeps generic save/network failure distinct from conflict', async () => {
    const document = createDefaultStoreDesign('clean-minimal');
    const adapter = createStoreDesignLifecycleAdapter(rpcClient(async () => ({
      data: null,
      error: {message: 'Failed to fetch'},
    })));

    await assert.rejects(
      adapter.saveDraft({expectedRevision: 2, document}),
      (error: unknown) => error instanceof Error && !(error instanceof StoreDesignConflictError) && /Failed to fetch/.test(error.message),
    );
  });

  it('publishes and rolls back through owner-resolved RPCs', async () => {
    const doc = createDefaultStoreDesign('street-bold');
    const calls: Array<{fn: string; args?: Record<string, unknown>}> = [];
    const lifecycle = {
      shop_id: 'server-owned-shop',
      draft_document: doc,
      published_document: doc,
      previous_published_document: null,
      draft_revision: 4,
      published_revision: 5,
      updated_at: null,
      published_at: null,
    };
    const adapter = createStoreDesignLifecycleAdapter(rpcClient(async (fn, args) => {
      calls.push({fn, args});
      return {data: lifecycle, error: null};
    }));

    assert.equal((await adapter.publishDraft({expectedDraftRevision: 4})).publishedRevision, 5);
    assert.equal((await adapter.rollbackPublished()).draftRevision, 4);
    assert.deepEqual(calls, [
      {fn: 'publish_store_design_draft', args: {p_expected_draft_revision: 4}},
      {fn: 'rollback_store_design_published', args: undefined},
    ]);
  });
});
