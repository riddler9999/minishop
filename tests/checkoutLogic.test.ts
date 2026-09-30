import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  checkoutIntentFingerprint,
  clearCheckoutIntent,
  getOrCreateCheckoutIntent,
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
    assert.match(source, /api\.quoteOrder/);
    assert.match(source, /isCheckoutReady/);
    assert.match(source, /newIdempotencyKey/);
    assert.equal(source.includes('function newIdempotencyKey()'), false);
  }
});


test('checkout intent survives reload for the same cart binding and expires or rotates when binding changes', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
  const fingerprint = checkoutIntentFingerprint({
    itemIds: ['p1'],
    quantities: [1],
    region: 'Yangon',
    township: 'Hlaing',
    paymentMethod: 'cod',
  });

  const first = getOrCreateCheckoutIntent({scope: 'shop-a', fingerprint, storage, now: 1_000});
  const reloaded = getOrCreateCheckoutIntent({scope: 'shop-a', fingerprint, storage, now: 2_000});
  assert.equal(reloaded, first);

  const changed = getOrCreateCheckoutIntent({
    scope: 'shop-a',
    fingerprint: checkoutIntentFingerprint({
      itemIds: ['p1'],
      quantities: [2],
      region: 'Yangon',
      township: 'Hlaing',
      paymentMethod: 'cod',
    }),
    storage,
    now: 3_000,
  });
  assert.notEqual(changed, first);

  const expired = getOrCreateCheckoutIntent({scope: 'shop-a', fingerprint, storage, now: 31 * 60 * 1000});
  assert.notEqual(expired, first);
});

test('successful checkout clears persisted intent', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
  const fingerprint = checkoutIntentFingerprint({
    itemIds: ['p1'],
    quantities: [1],
    region: 'Yangon',
    township: 'Hlaing',
    paymentMethod: 'cod',
  });
  getOrCreateCheckoutIntent({scope: 'shop-a', fingerprint, storage, now: 1_000});
  assert.equal(data.size, 1);
  clearCheckoutIntent('shop-a', storage);
  assert.equal(data.size, 0);
});
