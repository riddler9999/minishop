import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migration = new URL('../supabase/migrations/0027_failed_lookup_rate_limit.sql', import.meta.url);
const api = new URL('../api/storefront-orders.ts', import.meta.url);

describe('failed lookup rate-limit durability', () => {
  it('returns lookup misses instead of raising after the limiter hit', async () => {
    const sql = await readFile(migration, 'utf8');
    assert.match(sql, /perform private\.enforce_rate_limit\('lookup_order',\s*30,\s*interval '5 minutes'\)/i);
    assert.match(sql, /return jsonb_build_object\('error',\s*'invalid_lookup'\)/i);
    assert.match(sql, /return jsonb_build_object\('error',\s*'order_not_found'\)/i);
    assert.doesNotMatch(sql, /raise exception 'order_not_found'/i);
  });

  it('bounds stale limiter cleanup and indexes cleanup time', async () => {
    const sql = await readFile(migration, 'utf8');
    assert.match(sql, /api_rate_limits_requested_at_idx/i);
    assert.match(sql, /requested_at < now\(\) - interval '1 day'[\s\S]*?limit 500/i);
  });

  it('maps committed lookup business failures back to HTTP semantics', async () => {
    const source = await readFile(api, 'utf8');
    assert.match(source, /lookupError === 'invalid_lookup'[\s\S]*?400/i);
    assert.match(source, /lookupError === 'order_not_found'[\s\S]*?404/i);
    assert.match(source, /rate_limit_exceeded[\s\S]*?429/i);
  });
});
