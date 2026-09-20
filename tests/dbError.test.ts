import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';
import {
  DB_ERROR_MESSAGES,
  DEFAULT_DB_ERROR_MESSAGE,
  mapDbError,
  type DbErrorCode,
} from '../src/domain/dbError.ts';

const migrationPath = new URL('../supabase/migrations/0007_production_hardening.sql', import.meta.url);

// Every code the migration raises via `raise exception '<code>'`, with the
// `:%`/`:v_id` format suffix on the stock codes stripped. This reads the actual
// DB contract so the catalog can't silently drift from it.
async function codesRaisedByMigration(): Promise<Set<string>> {
  const sql = await readFile(migrationPath, 'utf8');
  const codes = new Set<string>();
  for (const m of sql.matchAll(/raise\s+exception\s+'([a-z_]+)/gi)) {
    codes.add(m[1]);
  }
  return codes;
}

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

  it('has a Burmese message for every code migration 0007 actually raises', async () => {
    // Real drift guard: reads the codes out of the migration SQL and asserts the
    // catalog covers each one. A new/renamed typed code in a future migration
    // fails here until it is added to DB_ERROR_MESSAGES.
    const raised = await codesRaisedByMigration();
    assert.ok(raised.size > 0, 'expected to parse at least one raised code from the migration');
    for (const code of raised) {
      assert.ok(code in DB_ERROR_MESSAGES, `catalog is missing a message for '${code}'`);
    }
  });
});
