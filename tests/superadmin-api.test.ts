import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createSuperadminHandler} from '../api/superadmin.ts';

function responseRecorder() {
  const state: {status?: number; body?: any} = {};
  const res = {
    statusCode: 200,
    setHeader() { return res; },
    end(body?: string) {
      state.status = res.statusCode;
      state.body = body ? JSON.parse(body) : undefined;
      return res;
    },
  };
  return {res, state};
}

describe('superadmin API behavior', () => {
  it('preserves authentication failures from the trusted access boundary', async () => {
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({error: 'Unauthorized', status: 401} as const)) as any,
    });
    const {res, state} = responseRecorder();
    await handler({method: 'GET'}, res);
    assert.equal(state.status, 401);
    assert.deepEqual(state.body, {error: 'Unauthorized'});
  });

  it('sanitizes unknown database errors from privileged mutations', async () => {
    const admin = {
      rpc: async () => ({
        data: null,
        error: {message: 'duplicate key value violates unique constraint "shops_slug_key"'},
      }),
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });
    const {res, state} = responseRecorder();
    await handler(
      {method: 'POST', body: {action: 'activate', shopId: 'shop-1', plan: 'starter', paymentIdentity: 'TX-UNKNOWN', idempotencyKey: '11111111-1111-4111-8111-111111111111'}},
      res,
    );
    assert.equal(state.status, 400);
    assert.equal(state.body.error, 'Action failed');
    assert.doesNotMatch(state.body.error, /shops_slug_key|duplicate key/i);
  });

  it('maps platform suspend/activate actions to the platform-only suspension field', async () => {
    const updates: Array<Record<string, unknown>> = [];
    const admin = {
      from(table: string) {
        assert.equal(table, 'shops');
        return {
          update(patch: Record<string, unknown>) {
            updates.push(patch);
            return {
              async eq(column: string, value: string) {
                assert.equal(column, 'id');
                assert.equal(value, 'shop-1');
                return {error: null};
              },
            };
          },
        };
      },
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });

    for (const [active, expectedSuspended] of [[false, true], [true, false]] as const) {
      const {res, state} = responseRecorder();
      await handler(
        {method: 'POST', body: {action: 'toggle-shop', shopId: 'shop-1', active}},
        res,
      );
      assert.equal(state.status, 200);
      assert.deepEqual(state.body, {ok: true});
      assert.deepEqual(updates.at(-1), {platform_suspended: expectedSuspended});
    }
  });

  it('maps known typed database errors without leaking raw diagnostics', async () => {
    const admin = {
      rpc: async () => ({data: null, error: {message: 'duplicate_payment'}}),
    };
    const handler = createSuperadminHandler({
      requireAccess: (async () => ({admin, user: {id: 'owner'}} as any)) as any,
    });
    const {res, state} = responseRecorder();
    await handler(
      {
        method: 'POST',
        body: {
          action: 'credit-pack',
          purchaseId: 'purchase-1',
          paymentIdentity: 'verified-transaction-1',
          idempotencyKey: '22222222-2222-4222-8222-222222222222',
        },
      },
      res,
    );
    assert.equal(state.status, 400);
    assert.equal(state.body.error, 'ဤငွေပေးချေမှုကို ထည့်သွင်းပြီးဖြစ်ပါသည်။');
  });
});
