import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {defaultMcpRateLimiter} from '../api/_mcp/rate-limit.ts';
import {McpError} from '../api/_mcp/errors.ts';

test('production MCP limiter calls the authenticated database RPC with the requested tool', async () => {
  let called: unknown[] | null = null;
  const client = {rpc: async (...args: unknown[]) => { called = args; return {error: null}; }} as any;
  await defaultMcpRateLimiter.check({userId: 'seller-a', shopId: 'shop-a', capabilities: new Set()} as any, 'list_products', client);
  assert.deepEqual(called, ['enforce_own_mcp_rate_limit', {p_action: 'list_products'}]);
});

test('production MCP limiter maps database exhaustion to a safe 429', async () => {
  const client = {rpc: async () => ({error: {message: 'mcp_rate_limit_exceeded'}})} as any;
  await assert.rejects(
    defaultMcpRateLimiter.check({userId: 'seller-a', shopId: 'shop-a', capabilities: new Set()} as any, 'list_products', client),
    (error: unknown) => error instanceof McpError && error.code === 'RATE_LIMITED' && error.status === 429,
  );
});

test('migration keeps the rate-limit table private and binds its counter to auth.uid()', async () => {
  const sql = await readFile('supabase/migrations/0038_distributed_mcp_rate_limit.sql', 'utf8');
  assert.match(sql, /alter table private\.mcp_rate_limits enable row level security/i);
  assert.match(sql, /revoke all on table private\.mcp_rate_limits from public, anon, authenticated/i);
  assert.match(sql, /v_user_id uuid := auth\.uid\(\)/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /mcp_rate_limit_exceeded/i);
  assert.match(sql, /grant execute on function public\.enforce_own_mcp_rate_limit\(text\)\s+to authenticated/i);
});

test('migration indexes the global stale-row cleanup by requested_at', async () => {
  const sql = await readFile('supabase/migrations/0038_distributed_mcp_rate_limit.sql', 'utf8');
  assert.match(
    sql,
    /create index if not exists mcp_rate_limits_requested_at_idx\s+on private\.mcp_rate_limits \(requested_at\)/i,
  );
});
