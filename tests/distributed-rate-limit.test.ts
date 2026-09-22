import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const hardening = new URL('../supabase/migrations/0007_production_hardening.sql', import.meta.url);
const checkoutApi = new URL('../api/checkout.ts', import.meta.url);
const lookupApi = new URL('../api/storefront-orders.ts', import.meta.url);

describe('distributed API rate limiting', () => {
  it('stores request hits in Postgres and serializes concurrent counters', async () => {
    const sql = await readFile(hardening, 'utf8');
    assert.match(sql, /create table if not exists private\.api_rate_limits/i);
    assert.match(sql, /pg_advisory_xact_lock/i);
    assert.match(sql, /raise exception 'rate_limit_exceeded'/i);
  });

  it('enforces limits inside both public anonymous RPCs', async () => {
    const sql = await readFile(hardening, 'utf8');
    assert.match(sql, /enforce_rate_limit\('place_order',\s*10,\s*interval '5 minutes'\)/i);
    assert.match(sql, /enforce_rate_limit\('lookup_order',\s*30,\s*interval '5 minutes'\)/i);
  });

  it('does not reintroduce a process-local API limiter', async () => {
    const [checkout, lookup] = await Promise.all([
      readFile(checkoutApi, 'utf8'),
      readFile(lookupApi, 'utf8'),
    ]);
    assert.doesNotMatch(checkout, /_rate-limit|new Map<.*count/i);
    assert.doesNotMatch(lookup, /_rate-limit|new Map<.*count/i);
  });

  it('maps database rate-limit failures to HTTP 429 at both API boundaries', async () => {
    const [checkout, lookup] = await Promise.all([
      readFile(checkoutApi, 'utf8'),
      readFile(lookupApi, 'utf8'),
    ]);
    assert.match(checkout, /rate_limit_exceeded[\s\S]*?429|429[\s\S]*?rate_limit_exceeded/i);
    assert.match(lookup, /rate_limit_exceeded[\s\S]*?429|429[\s\S]*?rate_limit_exceeded/i);
  });
});
