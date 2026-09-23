import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {createCheckoutHandler} from '../api/checkout.ts';
import {normalizeCheckoutInput} from '../api/checkout-input.ts';

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

function responseRecorder() {
  const state: {status?: number; body?: unknown} = {};
  const res = {
    status(code: number) { state.status = code; return res; },
    json(body: unknown) { state.body = body; return res; },
    setHeader() { return res; },
    end(body?: unknown) { state.body = body; return res; },
  };
  return {res, state};
}

function handlerWithRpc(rpc: (name: string, args: any) => Promise<any>) {
  let clientOptions: any;
  const handler = createCheckoutHandler({
    env: () => ({url: 'https://example.supabase.co', key: 'anon'}),
    createClient: ((_url: string, _key: string, options: any) => {
      clientOptions = options;
      return {rpc} as any;
    }) as any,
  });
  return {handler, getClientOptions: () => clientOptions};
}

describe('checkout API regression contract', () => {
  it('normalizes a valid request and preserves the idempotency key', () => {
    const input = normalizeCheckoutInput(validBody());
    assert.ok(input);
    assert.equal(input.idempotencyKey, '22222222-2222-4222-8222-222222222222');
    assert.deepEqual(input.items, [
      {product_id: '11111111-1111-4111-8111-111111111111', qty: 2},
    ]);
  });

  it('drops malformed idempotency keys instead of forwarding them', () => {
    const input = normalizeCheckoutInput(validBody({idempotencyKey: 'not-a-uuid'}));
    assert.ok(input);
    assert.equal(input.idempotencyKey, null);
  });

  it('caps the API cart at the same 25-item limit enforced by place_order', () => {
    const items = Array.from({length: 40}, (_, i) => ({
      id: `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`,
      qty: 1,
    }));
    const input = normalizeCheckoutInput(validBody({items}));
    assert.ok(input);
    assert.equal(input.items.length, 25);
  });

  it('rejects incomplete checkout payloads before database execution', async () => {
    let called = false;
    const {handler} = handlerWithRpc(async () => { called = true; return {data: null, error: null}; });
    const {res, state} = responseRecorder();
    await handler({method: 'POST', body: validBody({customer: {name: '', phone: '', street: '', region: '', township: ''}}), headers: {}, socket: {remoteAddress: '203.0.113.7'}}, res);
    assert.equal(state.status, 400);
    assert.equal(called, false);
  });

  it('forwards normalized input and a platform peer IP into place_order', async () => {
    let call: {name: string; args: any} | undefined;
    const {handler, getClientOptions} = handlerWithRpc(async (name, args) => {
      call = {name, args};
      return {data: {order_no: 'MS-1'}, error: null};
    });
    const {res, state} = responseRecorder();
    await handler({method: 'POST', body: validBody(), headers: {'x-forwarded-for': '198.51.100.99'}, socket: {remoteAddress: '203.0.113.7'}}, res);
    assert.equal(state.status, 200);
    assert.equal(call?.name, 'place_order');
    assert.equal(call?.args.p_idempotency_key, '22222222-2222-4222-8222-222222222222');
    assert.equal(getClientOptions().global.headers['x-forwarded-for'], '203.0.113.7');
  });

  it('maps database throttling to HTTP 429', async () => {
    const {handler} = handlerWithRpc(async () => ({data: null, error: {message: 'rate_limit_exceeded'}}));
    const {res, state} = responseRecorder();
    await handler({method: 'POST', body: validBody(), headers: {}, socket: {remoteAddress: '203.0.113.7'}}, res);
    assert.equal(state.status, 429);
  });
});
