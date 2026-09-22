import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import type {createClient as createSupabaseClient} from '@supabase/supabase-js';
import {createCheckoutHandler} from '../api/checkout.ts';

function mockResponse() {
  let body: unknown = null;
  return {
    statusCode: 0,
    headers: new Map<string, string>(),
    setHeader(name: string, value: string) {
      this.headers.set(name, value);
    },
    end(raw: string) {
      body = JSON.parse(raw);
    },
    get body() {
      return body;
    },
  };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'demo-shop',
    customer: {
      name: 'Moe',
      phone: '09999999999',
      street: 'No. 1',
      region: 'Yangon',
      township: 'Thanlyin',
    },
    paymentMethod: 'cod',
    paymentRefTail: '',
    items: [{id: '11111111-1111-4111-8111-111111111111', qty: 2}],
    idempotencyKey: '22222222-2222-4222-8222-222222222222',
    ...overrides,
  };
}

function handlerWithRpc(
  rpc: (name: string, args: Record<string, unknown>) => Promise<{data: unknown; error: null | {message: string}}>,
) {
  const client = {rpc};
  return createCheckoutHandler({
    env: () => ({url: 'https://example.supabase.co', key: 'anon'}),
    createClient: (() => client) as unknown as typeof createSupabaseClient,
  });
}

describe('checkout API regression contract', () => {
  it('forwards a valid UUID idempotency key and normalized items to place_order', async () => {
    const calls: Array<{name: string; args: Record<string, unknown>}> = [];
    const handler = handlerWithRpc(async (name, args) => {
      calls.push({name, args});
      return {data: {order_no: 'ORD-1'}, error: null};
    });
    const res = mockResponse();

    await handler({method: 'POST', body: validBody()}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, 'place_order');
    assert.equal(calls[0].args.p_idempotency_key, '22222222-2222-4222-8222-222222222222');
    assert.deepEqual(calls[0].args.p_items, [
      {product_id: '11111111-1111-4111-8111-111111111111', qty: 2},
    ]);
  });

  it('drops malformed idempotency keys instead of forwarding them', async () => {
    let forwarded: unknown = 'unset';
    const handler = handlerWithRpc(async (_name, args) => {
      forwarded = args.p_idempotency_key;
      return {data: {order_no: 'ORD-2'}, error: null};
    });
    const res = mockResponse();

    await handler({method: 'POST', body: validBody({idempotencyKey: 'not-a-uuid'})}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(forwarded, null);
  });

  it('caps the API cart at the same 25-item limit enforced by place_order', async () => {
    let forwardedItems: unknown[] = [];
    const handler = handlerWithRpc(async (_name, args) => {
      forwardedItems = args.p_items as unknown[];
      return {data: {order_no: 'ORD-3'}, error: null};
    });
    const res = mockResponse();
    const items = Array.from({length: 40}, (_, i) => ({
      id: `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`,
      qty: 1,
    }));

    await handler({method: 'POST', body: validBody({items})}, res);

    assert.equal(res.statusCode, 200);
    assert.equal(forwardedItems.length, 25);
  });

  it('rejects incomplete checkout payloads before touching the database', async () => {
    let calls = 0;
    const handler = handlerWithRpc(async () => {
      calls += 1;
      return {data: null, error: null};
    });
    const res = mockResponse();

    await handler(
      {method: 'POST', body: validBody({customer: {name: '', phone: '', street: '', region: '', township: ''}})},
      res,
    );

    assert.equal(res.statusCode, 400);
    assert.equal(calls, 0);
    assert.deepEqual(res.body, {error: 'Invalid checkout payload'});
  });

  it('maps the database distributed rate-limit error to HTTP 429', async () => {
    const handler = handlerWithRpc(async () => ({
      data: null,
      error: {message: 'rate_limit_exceeded'},
    }));
    const res = mockResponse();

    await handler({method: 'POST', body: validBody()}, res);

    assert.equal(res.statusCode, 429);
    assert.match(String((res.body as {error: string}).error), /များ|ကြိုးစား|request/i);
  });
});
