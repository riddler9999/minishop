import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {readFile} from 'node:fs/promises';
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

  it('rejects incomplete checkout payloads before database execution', () => {
    const input = normalizeCheckoutInput(
      validBody({customer: {name: '', phone: '', street: '', region: '', township: ''}}),
    );
    assert.equal(input, null);
  });

  it('wires normalized input into place_order and maps DB throttling to HTTP 429', async () => {
    const source = await readFile(new URL('../api/checkout.ts', import.meta.url), 'utf8');
    assert.match(source, /normalizeCheckoutInput\(req\.body\)/);
    assert.match(source, /sb\.rpc\('place_order'/);
    assert.match(source, /p_idempotency_key:\s*input\.idempotencyKey/);
    assert.match(source, /rate_limit_exceeded[\s\S]*?429|429[\s\S]*?rate_limit_exceeded/);
  });
});
