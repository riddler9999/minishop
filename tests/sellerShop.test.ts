import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  recoverCreateShopError,
  settleOwnShopLookup,
  SLUG_TAKEN_MESSAGE,
  SLUG_FORMAT_MESSAGE,
} from '../src/domain/shopAccess.ts';

// A stand-in for the mapped OwnShop the real lookup returns. The helpers are
// generic over the shop shape, so any sentinel object exercises them.
const SHOP = {id: 'shop-1', slug: 'su-su-fashion'};

describe('recoverCreateShopError', () => {
  it('recovers to the existing shop when a 23505 owner already has one', async () => {
    // Same-owner double-submit: the insert trips a unique constraint, and this
    // owner already owns a shop — recover to it idempotently instead of erroring.
    const result = await recoverCreateShopError({code: '23505', message: 'duplicate key value'}, async () => SHOP);
    assert.deepEqual(result, SHOP);
  });

  it('throws the Burmese slug-conflict error on 23505 when the owner has no shop', async () => {
    // The slug is taken by someone else and this owner owns nothing to recover to.
    await assert.rejects(
      () => recoverCreateShopError({code: '23505', message: 'duplicate key value'}, async () => null),
      (e: Error) => {
        assert.equal(e.message, SLUG_TAKEN_MESSAGE);
        return true;
      },
    );
  });

  it('maps a slug-format constraint violation to Burmese copy', async () => {
    await assert.rejects(
      () =>
        recoverCreateShopError(
          {code: '23514', message: 'new row violates check constraint "shops_slug_format"'},
          async () => {
            throw new Error('lookup must not run for a non-unique error');
          },
        ),
      (e: Error) => {
        assert.equal(e.message, SLUG_FORMAT_MESSAGE);
        return true;
      },
    );
  });

  it('passes through an unrecognized error message', async () => {
    await assert.rejects(
      () => recoverCreateShopError({code: '42501', message: 'permission denied'}, async () => null),
      (e: Error) => {
        assert.equal(e.message, 'permission denied');
        return true;
      },
    );
  });
});

describe('settleOwnShopLookup', () => {
  it('treats a null result as "no shop yet" (ready), not an error', async () => {
    const result = await settleOwnShopLookup(async () => null);
    assert.deepEqual(result, {status: 'ready', shop: null});
  });

  it('returns the shop when the lookup resolves to one', async () => {
    const result = await settleOwnShopLookup(async () => SHOP);
    assert.deepEqual(result, {status: 'ready', shop: SHOP});
  });

  it('treats a thrown lookup as a retryable error, never "no shop"', async () => {
    const result = await settleOwnShopLookup(async () => {
      throw new Error('network down');
    });
    assert.deepEqual(result, {status: 'error'});
  });
});
