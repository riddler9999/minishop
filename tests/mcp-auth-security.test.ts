import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {McpError} from '../api/_mcp/errors.ts';
import {authenticateSeller, type AuthDeps} from '../api/_mcp/auth.ts';
import {requireCapability} from '../api/_mcp/capabilities.ts';

function req(token?: string) {
  return {headers: token ? {authorization: `Bearer ${token}`} : {}} as any;
}

function deps(overrides: Partial<AuthDeps> = {}): AuthDeps {
  const authClient = {
    auth: {
      async getUser(token: string) {
        if (token === 'expired') return {data: {user: null}, error: {message: 'expired'}};
        return {data: {user: {id: 'seller-a', email: 'a@example.com'}}, error: null};
      },
    },
  } as any;
  const sellerClient = {
    from(table: string) {
      assert.equal(table, 'shops');
      return {
        select() { return this; },
        eq(column: string, value: string) {
          if (column === 'owner_id') assert.equal(value, 'seller-a');
          return this;
        },
        async maybeSingle() {
          return {data: {id: 'shop-a'}, error: null};
        },
      };
    },
  } as any;
  return {
    createAuthClient: () => authClient,
    createSellerClient: (_token: string) => sellerClient,
    capabilitiesForUser: async () => new Set([
      'store:read','store:write','profile:read','profile:write','products:read','orders:read','inventory:read','analytics:read'
    ] as const),
    ...overrides,
  };
}

describe('MiniShop MCP seller auth/security', () => {
  it('denies unauthenticated requests', async () => {
    await assert.rejects(authenticateSeller(req(), deps()), (e: unknown) => e instanceof McpError && e.code === 'AUTH_REQUIRED');
  });

  it('denies invalid or expired tokens without provider detail', async () => {
    await assert.rejects(authenticateSeller(req('expired'), deps()), (e: unknown) =>
      e instanceof McpError && e.code === 'TOKEN_EXPIRED' && !/expired/i.test(e.message));
  });

  it('resolves identity and owned shop only from validated token', async () => {
    const result = await authenticateSeller(req('valid'), deps());
    assert.equal(result.context.userId, 'seller-a');
    assert.equal(result.context.shopId, 'shop-a');
  });

  it('does not allow request-supplied tenant identifiers to change context', async () => {
    const result = await authenticateSeller({...req('valid'), body: {shop_id: 'shop-b', owner_id: 'seller-b', user_id: 'seller-b'}}, deps());
    assert.equal(result.context.userId, 'seller-a');
    assert.equal(result.context.shopId, 'shop-a');
  });

  it('fails when validated seller has no owned shop', async () => {
    const noShop = deps({
      createSellerClient: () => ({
        from() { return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:null,error:null};}}; },
      }) as any,
    });
    await assert.rejects(authenticateSeller(req('valid'), noShop), (e: unknown) => e instanceof McpError && e.code === 'SHOP_NOT_FOUND');
  });

  it('enforces MiniShop capabilities independently of OAuth scopes', () => {
    const context = {userId:'seller-a',shopId:'shop-a',capabilities:new Set(['store:write'] as const)};
    assert.doesNotThrow(() => requireCapability(context, 'store:write'));
    assert.throws(() => requireCapability(context, 'store:publish'), (e: unknown) => e instanceof McpError && e.code === 'INSUFFICIENT_SCOPE');
    assert.throws(() => requireCapability(context, 'products:read'), (e: unknown) => e instanceof McpError && e.code === 'INSUFFICIENT_SCOPE');
  });
});
