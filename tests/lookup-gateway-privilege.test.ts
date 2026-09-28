import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';

const migration = new URL('../supabase/migrations/0027_failed_lookup_rate_limit.sql', import.meta.url);
const backend = new URL('../api/_storefront-lookup-backend.ts', import.meta.url);
const gateway = new URL('../api/storefront-orders.ts', import.meta.url);

describe('trusted storefront lookup boundary', () => {
  it('revokes direct anonymous/authenticated execution and grants only service_role', async () => {
    const sql = await readFile(migration, 'utf8');
    assert.match(sql, /revoke all on function public\.lookup_order\(text,text,text\)[\s\S]*?from public, anon, authenticated/i);
    assert.match(sql, /grant execute on function public\.lookup_order\(text,text,text\)[\s\S]*?to service_role/i);
    assert.doesNotMatch(sql, /grant execute[\s\S]{0,120}to anon, authenticated/i);
  });

  it('keeps the privileged client inside a narrow server-only helper', async () => {
    const source = await readFile(backend, 'utf8');
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.match(source, /\.rpc\('lookup_order'/);
    assert.doesNotMatch(source, /\.from\(/);
    assert.doesNotMatch(source, /auth\.admin|auth\.getUser|authorization/i);
  });

  it('does not accept or proxy buyer authorization credentials at the public endpoint', async () => {
    const source = await readFile(gateway, 'utf8');
    assert.match(source, /lookupOrderBackend/);
    assert.doesNotMatch(source, /req\.headers\?\.authorization|req\.headers\.authorization/i);
  });
});
