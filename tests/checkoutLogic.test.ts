import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  isCheckoutReady,
  isOnlinePayment,
  newIdempotencyKey,
  paymentAccounts,
  resolveShippingFee,
} from '../src/features/checkout/checkoutLogic.ts';

test('resolveShippingFee uses matching live zone and never falls back to demo fee while live config is pending', () => {
  assert.equal(resolveShippingFee({
    region: 'Yangon',
    township: 'Hlaing',
    live: true,
    shippingConfig: {defaultFee: 5000, zones: [{region: 'Yangon', township: 'Hlaing', fee: 2500}]},
    demoFee: 1000,
  }), 2500);
  assert.equal(resolveShippingFee({
    region: 'Yangon',
    township: 'Hlaing',
    live: true,
    shippingConfig: null,
    demoFee: 1000,
  }), null);
});

test('resolveShippingFee uses live default zone and demo fee only in demo mode', () => {
  assert.equal(resolveShippingFee({
    region: 'Yangon',
    township: 'Bahan',
    live: true,
    shippingConfig: {defaultFee: 4000, zones: []},
    demoFee: 1000,
  }), 4000);
  assert.equal(resolveShippingFee({
    region: 'Yangon',
    township: 'Bahan',
    live: false,
    shippingConfig: null,
    demoFee: 1200,
  }), 1200);
});

test('checkout readiness enforces required fields, item count, fee and 5 digit online reference', () => {
  const base = {
    name: 'Moe',
    phone: '0912345678',
    street: '123 Main',
    region: 'Yangon',
    township: 'Hlaing',
    fee: 2500,
    itemCount: 1,
  };
  assert.equal(isCheckoutReady({...base, method: 'cod', refTail: ''}), true);
  assert.equal(isCheckoutReady({...base, method: 'kpay', refTail: '1234'}), false);
  assert.equal(isCheckoutReady({...base, method: 'kpay', refTail: '12a45'}), false);
  assert.equal(isCheckoutReady({...base, method: 'wave', refTail: '12345'}), true);
  assert.equal(isCheckoutReady({...base, method: 'cod', refTail: '', itemCount: 0}), false);
  assert.equal(isCheckoutReady({...base, method: 'cod', refTail: '', fee: null}), false);
});

test('payment helpers select provider accounts and classify online methods', () => {
  const accounts = [
    {provider: 'kpay', accountName: 'A', phone: '1'},
    {provider: 'wave', accountName: 'B', phone: '2'},
  ];
  assert.equal(isOnlinePayment('cod'), false);
  assert.equal(isOnlinePayment('kpay'), true);
  assert.equal(paymentAccounts(accounts as never[], 'wave').length, 1);
});

test('idempotency keys are non-empty and unique across new checkout intents', () => {
  const first = newIdempotencyKey();
  const second = newIdempotencyKey();
  assert.ok(first.length >= 16);
  assert.ok(second.length >= 16);
  assert.notEqual(first, second);
});

test('production and fashion checkout both consume the canonical checkout logic module', async () => {
  const production = await readFile(new URL('../src/features/checkout/pages/Checkout.tsx', import.meta.url), 'utf8');
  const fashion = await readFile(new URL('../src/features/fashion-demo/pages/FashionCheckout.tsx', import.meta.url), 'utf8');

  for (const source of [production, fashion]) {
    assert.match(source, /checkoutLogic/);
    assert.match(source, /resolveShippingFee/);
    assert.match(source, /isCheckoutReady/);
    assert.match(source, /newIdempotencyKey/);
    assert.equal(source.includes('function newIdempotencyKey()'), false);
  }
});
