import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
  MINI_SHOP_CAPABILITIES,
  MCP_TOOL_NAMES,
  createRequestId,
} from '../api/mcp/contracts.ts';
import {McpError, toSafeMcpError} from '../api/mcp/errors.ts';

describe('MiniShop MCP contract primitives', () => {
  it('uses the approved MiniShop capability vocabulary only', () => {
    assert.deepEqual(MINI_SHOP_CAPABILITIES, [
      'store:read',
      'store:write',
      'store:publish',
      'profile:read',
      'profile:write',
      'products:read',
      'orders:read',
      'inventory:read',
      'analytics:read',
    ]);
    assert.equal(MINI_SHOP_CAPABILITIES.some((value) => value.includes('superadmin')), false);
  });

  it('exposes exactly the approved seller tool names', () => {
    assert.deepEqual(MCP_TOOL_NAMES, [
      'get_store_design',
      'update_store_theme',
      'add_store_section',
      'update_store_section',
      'move_store_section',
      'remove_store_section',
      'publish_store',
      'rollback_store_design',
      'get_shop_profile',
      'update_shop_profile',
      'list_products',
      'get_product',
      'list_orders',
      'get_order',
      'get_inventory_summary',
      'list_low_stock_products',
      'get_sales_summary',
      'get_best_selling_products',
    ]);
    assert.equal(MCP_TOOL_NAMES.some((value) => /superadmin|sql|rpc|table/i.test(value)), false);
  });

  it('creates non-empty request ids', () => {
    const a = createRequestId();
    const b = createRequestId();
    assert.ok(a.length >= 16);
    assert.notEqual(a, b);
  });

  it('preserves stable safe error codes and redacts unsafe internal details', () => {
    const source = new Error('postgres service_role Authorization: Bearer secret-token');
    const safe = toSafeMcpError(source, 'req-123');
    assert.equal(safe.code, 'INTERNAL_ERROR');
    assert.equal(safe.status, 500);
    assert.equal(safe.requestId, 'req-123');
    assert.doesNotMatch(safe.message, /postgres|service_role|authorization|bearer|secret-token/i);

    const explicit = toSafeMcpError(new McpError('INVALID_CURSOR', 400, 'Invalid cursor'), 'req-456');
    assert.equal(explicit.code, 'INVALID_CURSOR');
    assert.equal(explicit.status, 400);
    assert.equal(explicit.requestId, 'req-456');
    assert.equal(explicit.message, 'Invalid cursor');
  });
});
