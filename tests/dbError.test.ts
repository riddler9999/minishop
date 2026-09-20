import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  DB_ERROR_MESSAGES,
  DEFAULT_DB_ERROR_MESSAGE,
  mapDbError,
  type DbErrorCode,
} from '../src/domain/dbError.ts';

describe('mapDbError', () => {
  it('maps every bare code to its Burmese message', () => {
    for (const code of Object.keys(DB_ERROR_MESSAGES) as DbErrorCode[]) {
      assert.equal(mapDbError(code), DB_ERROR_MESSAGES[code], code);
    }
  });

  it('strips the :<product_id> suffix on stock-related codes', () => {
    const pid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
    assert.equal(mapDbError(`product_unavailable:${pid}`), DB_ERROR_MESSAGES.product_unavailable);
    assert.equal(mapDbError(`insufficient_stock:${pid}`), DB_ERROR_MESSAGES.insufficient_stock);
  });

  it('does not let a shorter code shadow a longer one', () => {
    // invalid_cart is a prefix of invalid_cart_item — the exact/longest match wins.
    assert.equal(mapDbError('invalid_cart_item'), DB_ERROR_MESSAGES.invalid_cart_item);
    assert.equal(mapDbError('invalid_cart'), DB_ERROR_MESSAGES.invalid_cart);
  });

  it('finds a known code even when the client wraps the message', () => {
    assert.equal(
      mapDbError('postgres error: rate_limit_exceeded (P0001)'),
      DB_ERROR_MESSAGES.rate_limit_exceeded,
    );
  });

  it('returns the fallback for unknown / non-typed errors', () => {
    assert.equal(mapDbError('Failed to fetch'), DEFAULT_DB_ERROR_MESSAGE);
    assert.equal(mapDbError('Failed to fetch', 'Order တင်၍မရပါ။'), 'Order တင်၍မရပါ။');
    assert.equal(mapDbError(''), DEFAULT_DB_ERROR_MESSAGE);
    assert.equal(mapDbError(null, 'fallback'), 'fallback');
    assert.equal(mapDbError(undefined), DEFAULT_DB_ERROR_MESSAGE);
  });

  it('covers all 18 typed exceptions raised by migration 0007', () => {
    // Guards against a code being added to the DB contract but not the catalog.
    assert.equal(Object.keys(DB_ERROR_MESSAGES).length, 18);
  });
});
