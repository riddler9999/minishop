import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile, readdir} from 'node:fs/promises';
import {
  DB_ERROR_MESSAGES,
  DEFAULT_DB_ERROR_MESSAGE,
  mapDbError,
  mapUpdateOwnShopError,
  type DbErrorCode,
} from '../src/domain/dbError.ts';

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);

// Codes raised only by an earlier function definition that a LATER migration
// replaced via CREATE OR REPLACE, so they are no longer part of the live DB
// contract and intentionally have no Burmese message. 0007 rewrote 0001's
// place_order(): `missing_customer` -> `invalid_customer`, and the order-number
// generation no longer raises `order_no_generation_failed`.
const SUPERSEDED_CODES = new Set(['missing_customer', 'order_no_generation_failed']);

// Every code raised via `raise exception '<code>'` across ALL migration files
// (the `:%`/`:v_id` format suffix on the stock codes is naturally excluded by
// the pattern). Scanning the whole directory — not just 0007 — is what makes
// this a real guard: a future 0008 raising a new typed code trips it too.
async function codesRaisedByMigrations(): Promise<Set<string>> {
  const names = (await readdir(migrationsDir)).filter((n) => n.endsWith('.sql')).sort();
  const codes = new Set<string>();
  for (const name of names) {
    const sql = await readFile(new URL(name, migrationsDir), 'utf8');
    for (const m of sql.matchAll(/raise\s+exception\s+'([a-z_]+)/gi)) {
      codes.add(m[1]);
    }
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

  it('maps the settings write boundary via its seller-specific fallback', () => {
    // mapUpdateOwnShopError = mapDbError bound to the shop-settings fallback.
    assert.equal(mapUpdateOwnShopError('business_plan_required'), DB_ERROR_MESSAGES.business_plan_required);
    assert.equal(mapUpdateOwnShopError('plan_is_platform_managed'), DB_ERROR_MESSAGES.plan_is_platform_managed);
    assert.equal(mapUpdateOwnShopError('Failed to fetch'), 'ဆိုင် အချက်အလက် ပြင်၍မရပါ။');
  });

  it('has a Burmese message for every code the migrations actually raise', async () => {
    // Real drift guard: reads the codes out of every migration's SQL and asserts
    // the catalog covers each live one. A new/renamed typed code in a future
    // migration (e.g. 0008) fails here until it is added to DB_ERROR_MESSAGES.
    const raised = await codesRaisedByMigrations();
    assert.ok(raised.size > 0, 'expected to parse at least one raised code from the migrations');
    for (const code of raised) {
      if (SUPERSEDED_CODES.has(code)) continue; // replaced by a later migration
      assert.ok(code in DB_ERROR_MESSAGES, `catalog is missing a message for '${code}'`);
    }
  });
});
